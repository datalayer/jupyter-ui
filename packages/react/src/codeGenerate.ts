/* @jsxImportSource next/server */

import OpenAI from "openai"
export const runtime = "edge"

export const CHAT_SETTING_LIMITS = {
  "gpt-4-1106-preview": {
    MIN_TEMPERATURE: 0.0,
    MAX_TEMPERATURE: 2.0,
    MAX_TOKEN_OUTPUT_LENGTH: 4096,
    MAX_CONTEXT_LENGTH: 128000
  },
}

const prompt_generate_code = `
You are a helpful Python code generator. Your job is to generate Python code based on
a command given by the user (wrapped between [COMMAND] [/COMMAND] tags).

You should limit yourself to return first markdown text explaining the code between [MARKDOWN] and [/MARKDOWN] 
tags and then runnable Python code, that is,
no markdown and no raw text between [PYTHON] and [/PYTHON] tags. Your output must be runnable
Python code (comments should only be above lines to explain the following code), that is, it should 
not contain [CODE] or [/CODE] tags or be between a python comment.
User's code might refer to existing code. Code that exists in previous lines will
be given between [CODE_PREV] and [/CODE_PREV] tags. Code that exists in the following
lines will be given between [CODE_POST] and [/CODE_POST] tags.

When generating output, you must re-use existing variables and only generate new code,
your output should not contain code that already exists in previous lines.
`;

// Prompt for fixing Python code based on user commands
const prompt_fix_code = `
You are a helpful Python code fixer. Your job is to fix Python code.  

The user code will be given between [ERROR_CODE] and [/ERROR_CODE] tags. While error messages produced by the code will be given
between [ERROR_MESSAGE] and [/ERROR_MESSAGE] tags. There might be more than one error. Your output must
be runnable Python code (comments ok), that is,
no markdown and no raw text. Your output must be runnable
Python code (comments should only be above lines to explain the following code), that is, it should 
not contain [CODE] or [/CODE] tags or be between a python comment. The returned code must be between [PYTHON] and [/PYTHON] code.

When generating output, you must re-use existing variables and only generate new code,
your output should not contain code that already exists in previous lines.
`;

// Prompt for modifying Python code based on user commands
const prompt_modify_code = `
You are a helpful Python code modifier. Your job is to modify Python code based on
a command given by the user  (wrapped between [COMMAND] [/COMMAND] tags).

You should limit yourself to return an updated Python code, that is, no markdown and
no raw text (Python commends are fine). The user code will be given between
[CODE] and [/CODE] tags. When a user says "modify code" or "this code", you should
modify the code between [CODE] and [/CODE] tags.

The user command will be given between [COMMAND] and [/COMMAND] tags. You must update
the code based on the command. Your output must be runnable
Python code (comments ok), that is, it should not contain [CODE] or [/CODE] tags.

User's code might refer to existing variables. Code that exist in previous lines will
be given between [CODE_PREV] and [/CODE_PREV] tags. Code that exist in following
lines will be given between [CODE_POST] and [/CODE_POST] tags.  When generating
output, you must re-use existing variables and only generate new code,
your output should not contain code that already exists in previous lines.
`;

const REQUEST_TYPE = Object.freeze({
  GENERATE_CODE: 'generateCode',
  FIX_CODE: 'fixCode'
})


export async function codeGenerate(request) {
  try {
    const { input: input, type: requestType } = request

    const prompt = requestType === REQUEST_TYPE['GENERATE_CODE'] ? prompt_generate_code : prompt_fix_code
    const openai = new OpenAI({
      apiKey: "replace key",
      dangerouslyAllowBrowser: true 
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4-1106-preview",
      messages: [
        {
          role: "system",
          content: prompt
        },
        {
          role: "user",
          content: input // Use the extracted input value
        }
      ],
      temperature: 0,
      max_tokens: CHAT_SETTING_LIMITS["gpt-4-1106-preview"].MAX_TOKEN_OUTPUT_LENGTH,

    });

    const content = response.choices[0].message.content;
    return content


  } catch (error: any) {
    console.error(error);
    const errorMessage = error.error?.message || "An unexpected error occurred";
    const errorCode = error.status || 500;
    return errorMessage
  }
}