from fastapi import Body, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from llm import selectorFinder

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)


@app.get("/")
async def get_default():
    return "Bromium Server LOL", 200


@app.post("/prompt")
async def get_prompt(prompt: str, html: str = Body(..., media_type="text/html")):
    return selectorFinder(html, prompt)
