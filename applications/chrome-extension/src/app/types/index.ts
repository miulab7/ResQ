export interface MailData {
  html: string;
  text: string;
  title: string;
  sender: string;
  pastHtml: string;
  receiveTime: string;
  now: string;
}

export interface PersonalInformation {
  fullName: string;
  email: string;
  affiliation: string;
  language: string;
  role: string;
  signature: string;
  otherInfo: string;
}

export interface CustomizeReply {
  sender: string;
  recipient: string;
  formality: string;
  tone: string;
  urgency: string;
  length: string;
  purpose: string;
  additionalRequest: string;
}

export interface Question {
  id: string;
  question: string;
  choices: string[];
  corresponding_part: string;
}

export interface SelectedOption {
  question: string;
  choices: string[];
}

export interface SelectedOptions {
  [key: string]: SelectedOption;
}