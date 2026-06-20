import os
import sys
from github import Github
from dotenv import load_dotenv

load_dotenv()

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

if not GITHUB_TOKEN  or GITHUB_TOKEN == "your_github_personal_access_token_here":
    print("Error: GITHUB_TOKEN is not set in the environment variables properly.")
    sys.exit(1)

def get_pr_diff(repo_name, pr_number):
    ghp = Github(GITHUB_TOKEN)

