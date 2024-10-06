from tinytune.prompt import prompt_job
from tinytune.pipeline import Pipeline
from gptcontext import GPTContext, GPTMessage
from dotenv import load_dotenv
import os
from bs4 import BeautifulSoup

load_dotenv()

gpt = GPTContext(model="gpt-4o", apiKey=os.getenv("OPENAI_API_KEY"))


def filter_html(input_html):
    soup = BeautifulSoup(input_html, "html.parser")
    for tag in soup(["head", "meta", "script", "style", "audio", "aria"]):
        tag.decompose()
    return str(soup)


def chunk_string(string, length):
    return (string[i : i + length] for i in range(0, len(string), length))


@prompt_job(id="html", context=gpt)
def ParseHtml(id, context, prevResult, input):
    # Filter the input HTML to remove unwanted tags
    cleaned_input = filter_html(input)

    # Chunk the cleaned HTML input into strings of 2048 characters
    chunks = chunk_string(cleaned_input, 2048)

    # Prepare the prompt for GPT
    prompt = """
        You're a selector generator, you take in a website HTML and build a context. \
        Once prompted to give a certain part of the website, you give the exact selector \
        for it. Just the selector alone, plain text, no explanation, no nothing. The HTML may \
        be given to you in chunks, so look out for it. If you see incomplete HTML, reply with 1.
        If you see the element we want, reply with STOP_HERE_NOW.
    """
    context = context.Prompt(GPTMessage("user", prompt))

    # Prompt the GPT model with each chunk
    for chunk in chunks:
        context = context.Prompt(GPTMessage("user", chunk))
        if "STOP_HERE_NOW" in context.Run().Messages[-1].Content:
            break

    # Finally, prompt the GPT model with the original selector prompt
    return context.Run().Messages[-1].Content


@prompt_job(id="selector", context=gpt)
def findSelector(id, context, prevResult, input):

    content = (
        context.Prompt(GPTMessage("user", prevResult))
        .Prompt(GPTMessage("user", input))
        .Run()
        .Messages[-1]
        .Content
    )
    print(content)
    return content


pipe = Pipeline(gpt)


def selectorFinder(html: str, userPrompt: str) -> str:
    return (
        pipe.AddJob(ParseHtml, input=html).AddJob(findSelector, input=userPrompt).Run()
    )
