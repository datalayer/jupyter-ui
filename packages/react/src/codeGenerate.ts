/* @jsxImportSource next/server */

import OpenAI from 'openai';
export const runtime = 'edge';

export const CHAT_SETTING_LIMITS = {
    'gpt-4-1106-preview': {
        MIN_TEMPERATURE: 0.0,
        MAX_TEMPERATURE: 2.0,
        MAX_TOKEN_OUTPUT_LENGTH: 4096,
        MAX_CONTEXT_LENGTH: 128000,
    },
};

const prompt_generate_code = `
You are a helpful Python code generator to generate quantitive finance code. Your job is to generate Python code based on
a command given by the user (wrapped between [COMMAND] [/COMMAND] tags).

You should limit yourself to return first markdown text explaining the code between §
characters and then runnable Python code, that is,
no markdown and no raw text between ¶ characters. Your output must be runnable
Python code (comments should only be above lines to explain the following code), that is, it should 
not be between a python comment. The format must be § [returned markdown] § ¶ [returned python] ¶

User's code might refer to existing code. Code that exists in previous lines will
be given between [CODE_PREV] and [/CODE_PREV] tags. 

When generating output, you must re-use existing variables and only generate new code,
your output should not contain code that already exists in previous lines.
`;

// Prompt for fixing Python code based on user commands
const prompt_fix_code = `
You are a helpful Python code fixer.  Your job is to modify Python code based on 
an optional command given by the user (wrapped between [COMMAND] [/COMMAND] tags). If there is no [COMMAND] tags, you
will just have to fix the user code between [ERROR_CODE] and [/ERROR_CODE] tags and the error message will be between [ERROR_MESSAGE] and 
[/ERROR_MESSAGE] tags.

There might be more than one error. Your output must
be runnable Python code (comments ok), that is,
no markdown and no raw text. Your output must be runnable
Python code (comments should only be above lines to explain the following code), that is, it should 
not contain [CODE] or [/CODE] tags or be between a python comment. 

The returned code must be between [PYTHON] and [/PYTHON] code.
`;

// Prompt for modifying Python code based on user commands
const prompt_modify_code = `
You are a helpful Python code modifier. Your job is to modify Python code based on
a command given by the user  (wrapped between [COMMAND] [/COMMAND] tags).

You should limit yourself to return updated Python code, that is, no markdown and
no raw text. The user code to be modified will be given between
[CODE] and [/CODE] tags. Your output must be runnable
Python code (comments should only be above lines to explain the following code), that is, it should 
not contain [CODE] or [/CODE] tags. The returned code should not be between a python comment

The returned code must be between [PYTHON] and [/PYTHON] code.
`;

const REQUEST_TYPE: RequestType = Object.freeze({
    generateCode: prompt_generate_code,
    fixCode: prompt_fix_code,
    modifyCode: prompt_modify_code,
});

interface RequestType {
    [key: string]: string; // Assuming the keys are strings and values are strings
}

export async function codeGenerate(request: any) {
    try {
        const { input, type, selectedNotebook } = request;
        const prompt = REQUEST_TYPE[type];

        const adapter = selectedNotebook?.adapter?.notebookPanel?.content;
        const model = selectedNotebook?.adapter?.notebookPanel?.model;
        const currentIndex = adapter?.activeCellIndex;

        const openai = new OpenAI({
            apiKey: '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',
            dangerouslyAllowBrowser: true,
        });

        // Create new cells
        const promptCell = model?.sharedModel.insertCell(currentIndex, {
            cell_type: 'raw',
            source: `## PROMPT: ${input}\n`,
            metadata: {
                trusted: true,
            },
        });

        const newCodeCell = model?.sharedModel.insertCell(currentIndex + 1, {
            cell_type: 'code',
            source: '', // Empty source initially
            metadata: {
                // This is an empty cell created by the user, thus is trusted
                trusted: true,
            },
        });

        const stream = await openai.chat.completions.create({
            model: 'gpt-4-1106-preview',
            messages: [
                {
                    role: 'system',
                    content: prompt,
                },
                {
                    role: 'user',
                    content: input,
                },
            ],
            temperature: 0,
            max_tokens:
                CHAT_SETTING_LIMITS['gpt-4-1106-preview']
                    .MAX_TOKEN_OUTPUT_LENGTH,
            stream: true, // Enable streaming
        });

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            console.log('Chunk: ', content);
            // Update notebook cells with the received content
            await updateNotebookCell(promptCell, newCodeCell, content);
        }
    } catch (error: any) {
        console.error(error);
        const errorMessage =
            error.error?.message || 'An unexpected error occurred';
        return errorMessage;
    }
}

// Define states for the streaming content
const STATE = {
    NONE: 'none',
    MARKDOWN: 'markdown',
    PYTHON: 'python',
};

let currentState = STATE.NONE;

async function updateNotebookCell(
    promptCell: any,
    codeCell: any,
    content: string
) {
    if (!promptCell || !codeCell) {
        console.error('Cells not found');
        return;
    }

    // Check for state-changing tags and update the current state accordingly
    if (content === '§') {
        currentState = STATE.MARKDOWN;
    } else if (content === '¶') {
        currentState = STATE.PYTHON;
    } else {
        // Append the content to the appropriate cell based on the current state
        if (currentState === STATE.MARKDOWN) {
            promptCell.source += content;
        } else if (currentState === STATE.PYTHON) {
            codeCell.source += content;
        }
    }

    // Optionally, you can add a delay to simulate typing animation
    await new Promise(resolve => setTimeout(resolve, 1));
}
