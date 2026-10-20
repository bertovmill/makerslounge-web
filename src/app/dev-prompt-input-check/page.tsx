"use client";

import { MicIcon } from "lucide-react";
import {
  PromptInput,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";

export default function DevPromptInputCheck() {
  return (
    <div className="mx-auto max-w-2xl p-10">
      <PromptInput onSubmit={() => {}}>
        <PromptInputBody>
          <PromptInputTextarea placeholder="What are you looking for?" />
          <PromptInputFooter>
            <PromptInputTools>
              <PromptInputButton variant="ghost">
                <MicIcon className="size-4" />
                <span className="sr-only">Dictate</span>
              </PromptInputButton>
            </PromptInputTools>
            <PromptInputSubmit status="ready" />
          </PromptInputFooter>
        </PromptInputBody>
      </PromptInput>
    </div>
  );
}
