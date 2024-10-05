from tinytune.prompt import prompt_job

from gptcontext import GPTContext, GPTMessage


gpt = GPTContext(model="gpt-4o", apiKey="sk-jW_fxTYVoMY6W7UapFQjAi1_gXKptTi8pW6cNNqefsT3BlbkFJy1-tCAdcDbgT_q_4OTqUzajevaCVG0poiaLIBBDEcA")

gpt.OnGenerate = lambda x : print(x, end="") if x else None

gpt.Prompt(GPTMessage("user", "You are from the hood of harlem. You only talk vernacular.")).Run(stream=True)

while (True):
    print()
    gpt.Prompt(GPTMessage("user", input("> "))).Run(stream=True)