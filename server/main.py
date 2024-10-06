from fastapi import Body, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from llm import selectorFinder
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)


# Define the request model
class PromptRequest(BaseModel):
    html: str
    prompt: str


@app.get("/")
async def get_default():
    return "Bromium Server LOL", 200

@app.post("/prompt")
async def get_prompt(response: PromptRequest):
    return selectorFinder(response.html, response.prompt)
