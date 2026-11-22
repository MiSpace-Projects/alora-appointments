'use server';

import { submitTestimonial } from '@/lib/data/testimonials';
import { testimonialSubmissionSchema } from '@/lib/testimonial-core';

export interface TestimonialFormState {
  status: 'idle' | 'error' | 'submitted';
  message?: string;
  fieldErrors?: Partial<Record<'rating' | 'body' | 'nameStyle' | 'consent', string>>;
}

const CLOSED_MESSAGES: Record<'ALREADY_SUBMITTED' | 'EXPIRED' | 'NOT_FOUND', string> = {
  ALREADY_SUBMITTED: 'This testimonial has already been sent. Thank you!',
  EXPIRED: 'This link has expired. Email us if you would still like to share your experience.',
  NOT_FOUND: 'This link is not valid.',
};

export async function submitTestimonialAction(
  token: string,
  _previous: TestimonialFormState,
  formData: FormData,
): Promise<TestimonialFormState> {
  const parsed = testimonialSubmissionSchema.safeParse({
    rating: formData.get('rating') ?? '',
    body: formData.get('body') ?? '',
    nameStyle: formData.get('nameStyle') ?? '',
    consent: formData.get('consent') ?? undefined,
  });
  if (!parsed.success) {
    const fieldErrors: TestimonialFormState['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (
        (field === 'rating' || field === 'body' || field === 'nameStyle' || field === 'consent') &&
        !fieldErrors[field]
      ) {
        fieldErrors[field] = issue.message;
      }
    }
    return { status: 'error', message: 'Please check the highlighted fields.', fieldErrors };
  }

  try {
    const result = await submitTestimonial(token, parsed.data);
    if (result === 'SUBMITTED') return { status: 'submitted' };
    return { status: 'error', message: CLOSED_MESSAGES[result] };
  } catch (error) {
    console.error('[testimonial] submit failed:', error instanceof Error ? error.message : error);
    return { status: 'error', message: 'Something went wrong. Please try again in a moment.' };
  }
}
