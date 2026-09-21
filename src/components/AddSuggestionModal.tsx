import React from 'react';
import { SuggestVisualIdeaPage } from './SuggestVisualIdeaPage';
import { AttachedPlan, ItemPriority, UserPersona, ImagePosition, SuggestionImageItem } from '../types';

interface AddSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  plans: AttachedPlan[];
  preselectedPlanId?: string;
  currentPersona: UserPersona;
  onAddSuggestion: (suggestion: {
    planId: string;
    planTitle: string;
    planEmoji?: string;
    title: string;
    description: string;
    imageUrl: string;
    imagePosition?: ImagePosition;
    images?: SuggestionImageItem[];
    priority?: ItemPriority;
    link?: string;
  }) => void;
}

export const AddSuggestionModal: React.FC<AddSuggestionModalProps> = (props) => {
  return <SuggestVisualIdeaPage {...props} />;
};
