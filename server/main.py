from tinytune.prompt import prompt_job
from tinytune.pipeline import Pipeline
from gptcontext import GPTContext, GPTMessage
from dotenv import load_dotenv
import os
from bs4 import BeautifulSoup

load_dotenv()

gpt = GPTContext(model="gpt-4o", apiKey=os.getenv("OPENAI_API_KEY"))

# gpt.OnGenerate = lambda x: print(x, end="")

# print(gpt.Messages[-1].Content)


# @prompt_job(id="test", context=gpt)
# def Job(id, context, prevResult, inp):
#     num_words = random.randint(100, 300)

#     return (
#         context.Prompt(
#             GPTMessage(
#                 "user",
#                 f"You're a JSON API. You only respond in valid JSON no matter what. You only respond in plain text, no backticks, no extra explanation, just JSON.",
#             )
#         )
#         .Prompt(GPTMessage("user", inp))
#         .Run(stream=True)
#         .Messages[-1]
#         .Content
#     )


# @prompt_job(id="json", context=gpt)
# def ParseJson(id, context, prevResult):

#     print("\n" * 2)

#     print("Final JSON: ", prevResult)
#     return json.loads(prevResult)


# (pipe.AddJob(Job, inp="Random weather").AddJob(ParseJson).Run(stream=True))


def filter_html(input_html):
    # Use BeautifulSoup to parse and remove unwanted tags
    soup = BeautifulSoup(input_html, "html.parser")

    # Remove unwanted elements
    for tag in soup(["head", "meta", "script", "style"]):
        tag.decompose()

    # Return the cleaned HTML as a string
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
        be given to you in chunks, so look out for it. 
    """

    # Prompt the GPT model with each chunk
    for chunk in chunks:
        context = context.Prompt(GPTMessage("user", chunk))

    # Finally, prompt the GPT model with the original selector prompt
    return context.Prompt(GPTMessage("user", prompt)).Run().Messages[-1].Content


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

(
    pipe.AddJob(ParseHtml, input="<h1>Donate</h1>")
    .AddJob(findSelector, input="find the donate button")
    .Run()
)
