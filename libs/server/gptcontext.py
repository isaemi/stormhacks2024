import openai
import json
from tinytune.util.prompt import ValidatePrompt
from tinytune.llmcontext import LLMContext, Model, Message
from typing import Callable, Any


class GPTMessage(Message):
    __slots__ = ("Role", "Content")

    def __init__(self, role: str, content: str):
        super().__init__(role, content)


class GPTContext(LLMContext[GPTMessage]):
    def __init__(self, model: str, apiKey: str, promptFile: str | None = None):
        super().__init__(Model("openai", model))

        self.APIKey: str = apiKey
        self.Messages: list[GPTMessage] = []
        self.QueuePointer: int = 0

        openai.api_key = self.APIKey

    def LoadMessages(self, promptFile: str = "prompts.json") -> None:
        self.PromptFile = promptFile

        with open(promptFile, "r") as fp:
            self.Messages = json.load(fp)

    def Save(self, promptFile: str = "prompts.json") -> Any:
        try:
            with open(promptFile, "w") as fp:
                json.dump([message.ToDict() for message in self.Messages], fp, indent=2)

        except:
            print("An error occured in saving messages.")
            return self

        return self

    def Prompt(self, message: GPTMessage):
        self.MessageQueue.append(message)

        return self

    def Run(self, *args, **kwargs):
        stream: bool | None = kwargs.get("stream")

        while self.QueuePointer < len(self.MessageQueue):
            self.Messages.append(self.MessageQueue[self.QueuePointer])

            response = openai.chat.completions.create(
                model=self.Model.Name,
                messages=[message.ToDict() for message in self.Messages]
                + [self.MessageQueue[self.QueuePointer].ToDict()],
                temperature=0,
                stream=stream,
            )

            if stream:
                for chunk in response:
                    content = chunk.choices[0].delta.content
                    if content != None:
                        self.Messages[len(self.Messages) - 1].Content += content

                    self.OnGenerate(content)
            else:
                self.Messages[-1] = GPTMessage(
                    "user", str(response.choices[0].message.content)
                )

            self.QueuePointer += 1

        return self

# 콜백 함수 정의
def Callback(content):
    if content is not None:
        print(content, end="")
    else:
        print()

context.OnGenerateCallback = Callback

# 음성 명령을 받아서 마우스 이동 작업을 처리하는 프롬프트 작업 정의
@prompt_job(id="mouse_control", context=context)
def MouseControlJob(id: str, context: GPTContext, prevResult: Any):
    # 음성 명령을 텍스트로 받아서 해석
    command = context.Prompt(GPTMessage("user", "Move the mouse to the left")).Run(stream=True)

    # 받아온 음성 명령을 바탕으로 마우스 이동
    if "left" in command.Content.lower():
        robotjs.moveMouseRelative(-100, 0)  # 왼쪽으로 마우스 이동
    elif "right" in command.Content.lower():
        robotjs.moveMouseRelative(100, 0)   # 오른쪽으로 마우스 이동
    elif "up" in command.Content.lower():
        robotjs.moveMouseRelative(0, -100)  # 위쪽으로 마우스 이동
    elif "down" in command.Content.lower():
        robotjs.moveMouseRelative(0, 100)   # 아래쪽으로 마우스 이동

    return command.Content  # 처리된 명령 반환

# 파이프라인 생성 및 작업 추가
pipeline = Pipeline(context)
pipeline.AddJob(MouseControlJob)

# 파이프라인 실행
pipeline.Run()

class O1Context(LLMContext[GPTMessage]):
    def __init__(self, model: str, apiKey: str, promptFile: str | None = None):
        super().__init__(Model("openai", model))

        self.APIKey: str = apiKey
        self.Messages: list[GPTMessage] = []
        self.QueuePointer: int = 0

        openai.api_key = self.APIKey

    def LoadMessages(self, promptFile: str = "prompts.json") -> None:
        self.PromptFile = promptFile

        with open(promptFile, "r") as fp:
            self.Messages = json.load(fp)

    def Save(self, promptFile: str = "prompts.json") -> Any:
        try:
            with open(promptFile, "w") as fp:
                json.dump([message.ToDict() for message in self.Messages], fp, indent=2)

        except:
            print("An error occured in saving messages.")
            return self

        return self

    def Prompt(self, message: GPTMessage):
        self.MessageQueue.append(message)

        return self

    def Run(self, *args, **kwargs):
        stream: bool | None = kwargs.get("stream")

        if stream == None:
            stream = False

        while self.QueuePointer < len(self.MessageQueue):
            self.Messages.append(self.MessageQueue[self.QueuePointer])

            response = openai.chat.completions.create(
                model=self.Model.Name,
                messages=[message.ToDict() for message in self.Messages]
                + [self.MessageQueue[self.QueuePointer].ToDict()],
            )

            if stream:
                for chunk in response:
                    content = chunk.choices[0].delta.content
                    if content != None:
                        self.Messages[len(self.Messages) - 1].Content += content

                    self.OnGenerate(content)
            else:
                self.Messages[-1] = GPTMessage(
                    "user", str(response.choices[0].message.content)
                )

            self.QueuePointer += 1

        return self
