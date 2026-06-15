# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json

class GrantGenie(gl.Contract):
    # Mapping of github URLs to grant application data
    grants: TreeMap[str, str]
    total_grants: u256
    treasury_balance: u256

    def __init__(self):
        self.total_grants = u256(0)
        self.treasury_balance = u256(100000) # Mock treasury of 100k GEN

    @gl.public.write
    def apply_for_grant(self, github_url: str) -> str:
        # Check if already applied
        existing = self.grants.get(github_url)
        if existing is not None:
            return json.dumps({"status": "DUPLICATE", "message": "This project has already been evaluated."})

        # Step 1: Autonomous Web Scraping
        def _fetch_repo_data() -> str:
            try:
                response = gl.nondet.web.get(github_url)
                text = response.body.decode("utf-8")
                # We limit to 1000 chars to avoid timeout and isolate the core README/description
                return text[:1000]
            except Exception:
                return "ERROR_FETCHING"
                
        try:
            repo_data = gl.eq_principle.strict_eq(_fetch_repo_data)
        except Exception:
            repo_data = "ERROR_FETCHING"
            
        if repo_data == "ERROR_FETCHING" or "404" in repo_data:
            return json.dumps({"status": "ERROR", "message": "Failed to scrape GitHub repository."})

        # Step 2: AI Evaluation Consensus
        prompt = f"""
        GitHub Repository Data: {repo_data}
        
        Task: You are an expert Web3 Grant Committee AI. Evaluate this repository text.
        Does this look like a legitimate, technical software project that deserves funding? 
        Look for keywords related to code, apps, decentralized protocols, smart contracts, or infrastructure.
        
        Answer with EXACTLY ONE WORD:
        If it looks legitimate and technical, answer APPROVED.
        If it looks like spam, empty, or a non-software page, answer REJECTED.
        """
        
        def _evaluate_grant() -> str:
            return gl.nondet.exec_prompt(prompt)
            
        try:
            decision = gl.eq_principle.strict_eq(_evaluate_grant)
        except Exception:
            decision = "REJECTED"
            
        decision = decision.upper().strip()
        
        # Step 3: Autonomous Treasury Execution
        funding_amount = 0
        if "APPROVED" in decision:
            status = "FUNDED"
            funding_amount = 5000
            self.treasury_balance -= u256(5000)
            message = "Project verified by AI Oracle. 5,000 GEN streamed to builder."
        else:
            status = "REJECTED"
            message = "AI Oracle determined the project does not meet technical grant criteria."
            
        grant_record = {
            "id": str(self.total_grants),
            "url": github_url,
            "status": status,
            "funds_allocated": funding_amount,
            "message": message
        }
        
        record_json = json.dumps(grant_record)
        self.grants[github_url] = record_json
        self.total_grants += u256(1)
        
        return record_json

    @gl.public.view
    def get_grant_status(self, github_url: str) -> str:
        data = self.grants.get(github_url)
        if data is None:
            return "NOT_FOUND"
        return data

    @gl.public.view
    def get_treasury_balance(self) -> str:
        return str(self.treasury_balance)
