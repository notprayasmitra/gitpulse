import os
import sys
from github import Github, Auth
from dotenv import load_dotenv
import ollama

load_dotenv()

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

if not GITHUB_TOKEN  or GITHUB_TOKEN == "your_github_personal_access_token_here":
    print("Error: GITHUB_TOKEN is not set in the environment variables properly.")
    sys.exit(1)

def get_pr_diff(repo_name, pr_number):
    auth = Auth.Token(GITHUB_TOKEN)
    ghp = Github(auth=auth)

    try:
        repo = ghp.get_repo(repo_name)
        pr = repo.get_pull(pr_number)
        
        print(f"Successfully connected to repository! Fetching PR #{pr_number} from {repo_name}...")

        diff_text = ""

        for file in pr.get_files():
            diff_text += f"File: {file.filename}\n"
            diff_text += f"Changes:\n{file.patch}\n\n"

        return diff_text
    

    except Exception as e:
        print(f"Error fetching PR diff: {e}")
        sys.exit(1)

def analyze_diff_with_ollama(diff_text):
    print("Analyzing diff with local Qwen model...")

    system_prompt = (
        "You are an expert Senior Software Engineer. Your task is to review the following git pull request diff.\n"
        "Provide constructive feedback focusing on bugs, code cleanliness, and readability."
        "Keep your review concise, actionable, and formatted in clean Markdown."
    )

    try:
        response = ollama.generate(
            model="qwen2.5-coder:7b",
            system=system_prompt,
            prompt=f"Here is the PR diff data:\n\n{diff_text}"
        )
        return response['response']
    
    except Exception as e:
        print(f"Ollama Error: {e}")
        sys.exit(1)

def save_review_to_md(repo_name, pr_number, review_text):
    output_dir = "reviews"
    os.makedirs(output_dir, exist_ok=True)

    safe_repo_name = repo_name.replace("/", "_")

    file_path = os.path.join(output_dir, f"{safe_repo_name}_pr_{pr_number}.md")
    
    print(f"Saving code review locally to {file_path}...")

    content = (
        f"# GitPulse Local AI Code Review\n"
        f"- **Repository:** {repo_name}\n"
        f"- **Pull Request:** #{pr_number}\n"
        f"- **Model Used:** `qwen2.5-coder:7b`\n\n"
        f"---\n\n"
        f"{review_text}"
    )

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"Review saved successfully to {file_path}")

if __name__ == "__main__":
    test_repo = "noctalia-dev/noctalia"
    test_pr = 20

    pr_diff = get_pr_diff(test_repo, test_pr)
    
    if not pr_diff.strip():
        print("Connected, but this PR has no changes to analyze.")
    else:
        ai_review = analyze_diff_with_ollama(pr_diff)
        save_review_to_md(test_repo, test_pr, ai_review)