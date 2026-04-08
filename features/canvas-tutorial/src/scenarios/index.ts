import BasicChatbot from './BasicChatbot.json';
import TranslationBot from './TranslationBot.json';
import EmailWriter from './EmailWriter.json';
import PromptTemplate from './PromptTemplate.json';
import SummaryChain from './SummaryChain.json';
import StructuredOutput from './StructuredOutput.json';
import type { TutorialData } from '../types';

export const TUTORIALS: TutorialData[] = [
    BasicChatbot as TutorialData,
    TranslationBot as TutorialData,
    EmailWriter as TutorialData,
    PromptTemplate as TutorialData,
    SummaryChain as TutorialData,
    StructuredOutput as TutorialData,
];
