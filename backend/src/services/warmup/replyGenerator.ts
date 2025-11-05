import { WarmupTemplate, WarmupEmail } from '../../models';
import logger from '../../utils/logger';

interface ReplyContent {
  subject: string;
  body: string;
  templateId?: number;
}

/**
 * Get a random reply template
 */
export const getRandomReplyTemplate = async (category?: string): Promise<WarmupTemplate | null> => {
  try {
    const where: any = {
      isActive: true,
      hasReplyTemplate: false // Get templates that are replies themselves
    };

    if (category) {
      where.category = category;
    }

    const templates = await WarmupTemplate.findAll({ where });

    if (templates.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * templates.length);
    return templates[randomIndex];
  } catch (error: any) {
    logger.error('Failed to get reply template', { error: error.message });
    return null;
  }
};

/**
 * Generate variables for template
 */
export const generateTemplateVariables = (senderEmail: string, receiverEmail: string): Record<string, string> => {
  const senderName = senderEmail.split('@')[0];
  const receiverName = receiverEmail.split('@')[0];
  const senderFirstName = senderName.split('.')[0] || senderName;
  const receiverFirstName = receiverName.split('.')[0] || receiverName;

  const companies = [
    'Acme Corp', 'TechStart Inc', 'Global Solutions', 'Innovation Labs',
    'Digital Ventures', 'NextGen Systems', 'Prime Industries', 'Elite Services'
  ];

  const products = [
    'Platform', 'Software', 'Solution', 'Service', 'Tool',
    'System', 'Application', 'Dashboard', 'Portal'
  ];

  return {
    firstName: capitalizeFirst(receiverFirstName),
    lastName: 'Smith',
    senderName: capitalizeFirst(senderFirstName),
    company: companies[Math.floor(Math.random() * companies.length)],
    productName: products[Math.floor(Math.random() * products.length)],
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString(),
    invoiceNum: `INV-${Math.floor(Math.random() * 10000)}`,
    ticketNum: `TKT-${Math.floor(Math.random() * 10000)}`
  };
};

/**
 * Fill template with variables
 */
export const fillTemplate = (template: string, variables: Record<string, string>): string => {
  let filled = template;

  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    filled = filled.replace(regex, value);
  });

  return filled;
};

/**
 * Generate reply content
 */
export const generateReplyContent = async (
  originalEmail: WarmupEmail,
  senderEmail: string,
  receiverEmail: string
): Promise<ReplyContent> => {
  try {
    // Get original template if exists
    let category: string | undefined;
    if (originalEmail.templateId) {
      const originalTemplate = await WarmupTemplate.findByPk(originalEmail.templateId);
      if (originalTemplate) {
        category = originalTemplate.category;
      }
    }

    // Get reply template
    const replyTemplate = await getRandomReplyTemplate(category);

    if (!replyTemplate) {
      // Fallback to simple reply
      return {
        subject: `Re: ${originalEmail.subject}`,
        body: generateSimpleReply(senderEmail, receiverEmail)
      };
    }

    // Generate variables
    const variables = generateTemplateVariables(senderEmail, receiverEmail);

    // Fill template
    const subject = fillTemplate(replyTemplate.subject, variables);
    const body = fillTemplate(replyTemplate.body, variables);

    return {
      subject: `Re: ${subject}`,
      body,
      templateId: replyTemplate.id
    };
  } catch (error: any) {
    logger.error('Failed to generate reply content', { error: error.message });

    // Fallback to simple reply
    return {
      subject: `Re: ${originalEmail.subject}`,
      body: generateSimpleReply(senderEmail, receiverEmail)
    };
  }
};

/**
 * Generate simple reply (fallback)
 */
export const generateSimpleReply = (senderEmail: string, receiverEmail: string): string => {
  const senderName = senderEmail.split('@')[0];
  const senderFirstName = capitalizeFirst(senderName.split('.')[0] || senderName);

  const replies = [
    `Hi ${senderFirstName},\n\nThank you for reaching out. I've received your email and will get back to you shortly.\n\nBest regards`,
    `Hello ${senderFirstName},\n\nThanks for your message. I appreciate you taking the time to connect.\n\nBest`,
    `Hi ${senderFirstName},\n\nI got your email. Let me review the details and I'll respond soon.\n\nThanks`,
    `Hello,\n\nThanks for getting in touch. I'll review your message and get back to you.\n\nRegards`,
    `Hi ${senderFirstName},\n\nReceived your email. I'll take a look and respond shortly.\n\nBest regards`
  ];

  const randomIndex = Math.floor(Math.random() * replies.length);
  return replies[randomIndex];
};

/**
 * Calculate reply delay (2-8 hours in milliseconds, or 1-3 minutes in testing mode)
 */
export const calculateReplyDelay = (): number => {
  const isTestingMode = process.env.TESTING_MODE === 'true';

  if (isTestingMode) {
    // Testing mode: 1-3 minutes
    const minMinutes = 1;
    const maxMinutes = 3;
    const delayMinutes = Math.random() * (maxMinutes - minMinutes) + minMinutes;
    const delayMs = delayMinutes * 60 * 1000;

    logger.debug('Reply delay calculated (TESTING MODE)', { minutes: delayMinutes.toFixed(2) });
    return delayMs;
  }

  // Production mode: 2-8 hours
  const minHours = parseInt(process.env.MIN_REPLY_DELAY_HOURS || '2');
  const maxHours = parseInt(process.env.MAX_REPLY_DELAY_HOURS || '8');

  const delayHours = Math.random() * (maxHours - minHours) + minHours;
  const delayMs = delayHours * 60 * 60 * 1000;

  logger.debug('Reply delay calculated', { hours: delayHours.toFixed(2) });

  return delayMs;
};

/**
 * Determine if conversation should continue
 */
export const shouldContinueConversation = (
  currentStep: number,
  maxSteps: number
): boolean => {
  return currentStep < maxSteps;
};

/**
 * Add natural variations to reply
 */
export const addNaturalVariations = (body: string): string => {
  // Add greeting variations
  const greetings = ['Hi', 'Hello', 'Hey', 'Hi there'];
  const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];

  // Replace first word if it's a greeting
  if (body.startsWith('Hi ') || body.startsWith('Hello ') || body.startsWith('Hey ')) {
    body = body.replace(/^(Hi|Hello|Hey) /, `${randomGreeting} `);
  }

  // Add sign-off variations
  const signOffs = [
    'Best regards',
    'Best',
    'Thanks',
    'Regards',
    'Thank you',
    'Cheers',
    'Kind regards'
  ];

  const randomSignOff = signOffs[Math.floor(Math.random() * signOffs.length)];

  // Replace sign-off if it exists
  const signOffRegex = /(Best regards|Best|Thanks|Regards|Thank you|Cheers|Kind regards)/i;
  if (signOffRegex.test(body)) {
    body = body.replace(signOffRegex, randomSignOff);
  }

  return body;
};

/**
 * Helper: Capitalize first letter
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Generate conversation-aware reply (based on conversation step)
 */
export const generateConversationReply = async (
  originalEmail: WarmupEmail,
  conversationStep: number,
  senderEmail: string,
  receiverEmail: string
): Promise<ReplyContent> => {
  try {
    // First reply - detailed
    if (conversationStep === 1) {
      return generateReplyContent(originalEmail, senderEmail, receiverEmail);
    }

    // Subsequent replies - shorter and more casual
    const senderName = senderEmail.split('@')[0];
    const senderFirstName = capitalizeFirst(senderName.split('.')[0] || senderName);

    const shortReplies = [
      `Sounds good, ${senderFirstName}!`,
      `Perfect, thanks!`,
      `Great, appreciate it!`,
      `Understood, thank you.`,
      `Thanks for the update!`,
      `Got it, thanks!`,
      `All set, thank you!`
    ];

    const randomIndex = Math.floor(Math.random() * shortReplies.length);

    return {
      subject: `Re: ${originalEmail.subject}`,
      body: shortReplies[randomIndex]
    };
  } catch (error: any) {
    logger.error('Failed to generate conversation reply', { error: error.message });
    return generateReplyContent(originalEmail, senderEmail, receiverEmail);
  }
};
