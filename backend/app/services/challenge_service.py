import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status

from app.services.supabase_service import supabase
from app.services.piston_service import execute_code
from app.ai.provider_factory import get_ai_provider

logger = logging.getLogger(__name__)

PRACTICE_READINESS_THRESHOLD = 50
TOTAL_CHALLENGE_QUESTIONS = 25


class ChallengeService:
    @staticmethod
    async def get_or_generate_challenge(
        user_id: str,
        node_id: str,
        provider_name: str = "gemini"
    ) -> Dict[str, Any]:
        """
        Retrieves an ongoing 25-question challenge session (12 Easy, 10 Medium, 3 Hard)
        for a node or generates a new one. Also returns practice capability metrics.
        """
        try:
            # 1. Fetch user practice readiness (Accepted submissions count)
            practice_res = (
                supabase.table("submissions")
                .select("id", count="exact")
                .eq("user_id", user_id)
                .eq("status", "Accepted")
                .execute()
            )
            total_solved = (
                practice_res.count
                if practice_res.count is not None
                else len(practice_res.data or [])
            )
            is_capable = total_solved >= PRACTICE_READINESS_THRESHOLD

            # 2. Check for an existing active or passed challenge session
            res = (
                supabase.table("roadmap_challenges")
                .select("*")
                .eq("user_id", user_id)
                .eq("node_id", node_id)
                .order("created_at", desc=True)
                .execute()
            )

            if res.data and len(res.data) > 0:
                active_challenge = res.data[0]
                return {
                    "challenge": active_challenge,
                    "practice_count": total_solved,
                    "practice_threshold": PRACTICE_READINESS_THRESHOLD,
                    "is_capable": is_capable
                }

            # 3. Retrieve node metadata (topic, difficulty, position)
            node_res = (
                supabase.table("roadmap_nodes")
                .select("*")
                .eq("id", node_id)
                .execute()
            )

            if not node_res.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Roadmap node '{node_id}' not found."
                )

            node = node_res.data[0]
            topic = node.get("topic", "Data Structures & Algorithms")

            # 4. Generate 25-problem assessment pool (12 Easy, 10 Medium, 3 Hard)
            ai_provider = get_ai_provider(provider_name)

            if hasattr(ai_provider, "generate_challenge_pool"):
                questions = await ai_provider.generate_challenge_pool(
                    topic=topic,
                    easy_count=12,
                    medium_count=10,
                    hard_count=3
                )
            elif hasattr(ai_provider, "generate_assessment_set"):
                questions = await ai_provider.generate_assessment_set(
                    topic=topic,
                    distribution={"easy": 12, "medium": 10, "hard": 3}
                )
            else:
                questions: List[Dict[str, Any]] = []
                distribution = [("Easy", 12), ("Medium", 10), ("Hard", 3)]
                for diff, count in distribution:
                    for i in range(count):
                        problem = await ai_provider.generate_problem(
                            topic=topic,
                            difficulty=diff,
                            problem_type="challenge"
                        )
                        questions.append({
                            "index": len(questions),
                            "title": problem.get("title", f"{topic} {diff} Problem {i + 1}"),
                            "description": problem.get("description", ""),
                            "difficulty": diff,
                            "starter_code": problem.get("starter_code", "# Write your solution here\n\ndef solution():\n    pass\n"),
                            "test_cases": problem.get("test_cases", [])
                        })

            now_iso = datetime.now(timezone.utc).isoformat()
            challenge_data = {
                "user_id": user_id,
                "node_id": node_id,
                "questions": questions,
                "current_index": 0,
                "solved_indices": [],
                "status": "in_progress",
                "score": 0.0,
                "created_at": now_iso,
                "updated_at": now_iso
            }

            insert_res = (
                supabase.table("roadmap_challenges")
                .upsert(challenge_data, on_conflict="user_id,node_id")
                .execute()
            )

            if not insert_res.data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to persist challenge session."
                )

            return {
                "challenge": insert_res.data[0],
                "practice_count": total_solved,
                "practice_threshold": PRACTICE_READINESS_THRESHOLD,
                "is_capable": is_capable
            }

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error in get_or_generate_challenge: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Challenge setup failed: {str(e)}"
            )

    @staticmethod
    async def submit_challenge_question(
        user_id: str,
        node_id: str,
        question_index: int,
        code: str,
        language: str = "python"
    ) -> Dict[str, Any]:
        """
        Executes code for an individual question in the 25-problem challenge pool.
        When all 25 questions pass, marks challenge passed, completes node, and unlocks next node.
        """
        try:
            # 1. Fetch challenge record
            challenge_res = (
                supabase.table("roadmap_challenges")
                .select("*")
                .eq("user_id", user_id)
                .eq("node_id", node_id)
                .execute()
            )

            if not challenge_res.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Active challenge session not found."
                )

            challenge = challenge_res.data[0]
            questions = challenge.get("questions", [])

            if question_index < 0 or question_index >= len(questions):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid question index {question_index}."
                )

            target_question = questions[question_index]
            test_cases = target_question.get("test_cases", [])

            if not test_cases:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Question has no evaluation test cases."
                )

            # 2. Sandboxed execution via Piston execute_code
            test_results = await execute_code(
                code=code,
                language=language,
                test_cases=test_cases
            )

            results_list = test_results.get("test_cases", []) if isinstance(test_results, dict) else []
            total_cases = len(results_list)
            passed_cases = sum(1 for tc in results_list if tc.get("passed", False))
            passed = total_cases > 0 and (passed_cases == total_cases)

            # 3. Update solved indices
            solved_indices = set(challenge.get("solved_indices") or [])
            if passed:
                solved_indices.add(question_index)

            solved_list = sorted(list(solved_indices))
            total_questions = len(questions) if len(questions) > 0 else TOTAL_CHALLENGE_QUESTIONS
            is_all_completed = len(solved_list) == total_questions
            score = round((len(solved_list) / total_questions) * 100, 2)
            now_iso = datetime.now(timezone.utc).isoformat()

            update_payload: Dict[str, Any] = {
                "solved_indices": solved_list,
                "current_index": question_index,
                "score": score,
                "updated_at": now_iso
            }

            # 4. Handle complete challenge passing
            if is_all_completed:
                update_payload["status"] = "passed"
                update_payload["completed_at"] = now_iso

                # Fetch node details
                node_res = (
                    supabase.table("roadmap_nodes")
                    .select("*")
                    .eq("id", node_id)
                    .execute()
                )

                if node_res.data:
                    current_node = node_res.data[0]
                    current_position = current_node.get("position")
                    if current_position is None:
                        current_position = current_node.get("node_index", 0)
                    xp_reward = current_node.get("xp_reward", 150)

                    # Mark current roadmap node complete
                    supabase.table("roadmap_nodes").update({
                        "status": "completed",
                        "xp_earned": xp_reward,
                        "updated_at": now_iso
                    }).eq("id", node_id).execute()

                    # Unlock the sequential next roadmap node (supports position and node_index schemas)
                    if "position" in current_node:
                        supabase.table("roadmap_nodes").update({
                            "status": "unlocked",
                            "updated_at": now_iso
                        }).eq("user_id", user_id).eq("position", current_position + 1).eq("status", "locked").execute()
                    else:
                        supabase.table("roadmap_nodes").update({
                            "status": "unlocked",
                            "updated_at": now_iso
                        }).eq("user_id", user_id).eq("node_index", current_position + 1).eq("status", "locked").execute()

                    # Reward User XP
                    user_res = supabase.table("users").select("xp").eq("id", user_id).execute()
                    if user_res.data:
                        current_xp = user_res.data[0].get("xp", 0) or 0
                        supabase.table("users").update({
                            "xp": current_xp + xp_reward
                        }).eq("id", user_id).execute()

            supabase.table("roadmap_challenges").update(update_payload).eq("id", challenge["id"]).execute()

            return {
                "passed": passed,
                "passed_cases": passed_cases,
                "total_cases": total_cases,
                "question_index": question_index,
                "solved_count": len(solved_list),
                "total_questions": total_questions,
                "all_completed": is_all_completed,
                "score": score,
                "results": test_results
            }

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error in submit_challenge_question: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Question evaluation failed: {str(e)}"
            )

    @staticmethod
    async def get_challenge_history(user_id: str, node_id: str) -> Dict[str, Any]:
        """
        Returns the challenge history and question progress for a specific node.
        """
        try:
            res = (
                supabase.table("roadmap_challenges")
                .select("*")
                .eq("user_id", user_id)
                .eq("node_id", node_id)
                .execute()
            )
            return {"challenges": res.data or []}
        except Exception as e:
            logger.error(f"Error in get_challenge_history: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch challenge history: {str(e)}"
            )
