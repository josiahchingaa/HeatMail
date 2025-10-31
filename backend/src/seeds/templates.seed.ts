import { WarmupTemplate } from '../models';
import logger from '../utils/logger';

/**
 * Seed 100+ warmup email templates
 */
export const seedTemplates = async () => {
  try {
    logger.info('Seeding warmup templates...');

    const templates = [
      // ============ BUSINESS CATEGORY (25 templates) ============
      {
        category: 'business',
        subject: 'Quick question about {{topic}}',
        body: `Hi {{firstName}},\n\nI hope this email finds you well. I came across your work at {{company}} and was impressed by what you're doing.\n\nI have a quick question about {{topic}} that I think you might have insights on. Would you have a few minutes to share your thoughts?\n\nLooking forward to hearing from you.\n\nBest regards,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'company', 'topic', 'senderFirstName']
      },
      {
        category: 'business',
        subject: 'Following up on our conversation',
        body: `Hi {{firstName}},\n\nI wanted to follow up on our recent conversation about {{topic}}. I've given it some more thought and have a few ideas I'd like to share.\n\nWould you be available for a quick call this week?\n\nBest,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'topic', 'senderFirstName']
      },
      {
        category: 'business',
        subject: 'Interesting article I thought you\'d enjoy',
        body: `Hi {{firstName}},\n\nI recently came across an article about {{topic}} and immediately thought of you and your work at {{company}}.\n\nHere's the link: [article link]\n\nWould love to hear your thoughts on it.\n\nCheers,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'topic', 'company', 'senderFirstName']
      },
      {
        category: 'business',
        subject: 'Exploring potential collaboration',
        body: `Hi {{firstName}},\n\nI've been following {{company}}'s progress in the {{industry}} space, and I'm impressed by your approach.\n\nI believe there might be some interesting opportunities for collaboration between our teams. Would you be open to a brief conversation?\n\nBest regards,\n{{senderFirstName}}\n{{senderCompany}}`,
        language: 'en',
        variables: ['firstName', 'company', 'industry', 'senderFirstName', 'senderCompany']
      },
      {
        category: 'business',
        subject: 'Your insights on {{topic}}',
        body: `Hi {{firstName}},\n\nI'm currently researching {{topic}} and came across some of your work. Your perspective on {{specificAspect}} was particularly interesting.\n\nI'd love to learn more about your experience in this area. Would you have time for a quick chat?\n\nThank you,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'topic', 'specificAspect', 'senderFirstName']
      },
      {
        category: 'business',
        subject: 'Introduction from {{mutualConnection}}',
        body: `Hi {{firstName}},\n\n{{mutualConnection}} suggested I reach out to you regarding {{topic}}. They spoke highly of your expertise in this area.\n\nI'd appreciate the opportunity to connect and learn from your experience.\n\nBest,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'mutualConnection', 'topic', 'senderFirstName']
      },
      {
        category: 'business',
        subject: 'Thoughts on recent trends in {{industry}}',
        body: `Hi {{firstName}},\n\nI've been noticing some interesting trends in the {{industry}} sector lately, particularly around {{specificTrend}}.\n\nGiven your experience at {{company}}, I'd be curious to hear your perspective on how these changes might impact the market.\n\nWould you be open to a brief discussion?\n\nRegards,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'industry', 'specificTrend', 'company', 'senderFirstName']
      },
      {
        category: 'business',
        subject: 'Quick update on {{project}}',
        body: `Hi {{firstName}},\n\nJust wanted to share a quick update on the {{project}} initiative we discussed. We've made some significant progress and I thought you might find it interesting.\n\nWould you like me to share more details?\n\nBest,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'project', 'senderFirstName']
      },
      {
        category: 'business',
        subject: 'Congratulations on {{achievement}}',
        body: `Hi {{firstName}},\n\nI saw the news about {{achievement}} - congratulations! This is a significant milestone for {{company}}.\n\nI'd love to hear more about how you achieved this and what's next.\n\nBest wishes,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'achievement', 'company', 'senderFirstName']
      },
      {
        category: 'business',
        subject: 'Resource that might interest you',
        body: `Hi {{firstName}},\n\nI came across a resource about {{topic}} that I thought might be valuable for your work at {{company}}.\n\nLet me know if you'd like me to share the details.\n\nCheers,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'topic', 'company', 'senderFirstName']
      },
      // Add 15 more business templates...
      {
        category: 'business',
        subject: 'Meeting request for {{topic}}',
        body: `Hi {{firstName}},\n\nI hope you're doing well. I'd like to schedule a brief meeting to discuss {{topic}} and explore how we might work together.\n\nAre you available next week?\n\nBest,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'topic', 'senderFirstName']
      },
      {
        category: 'business',
        subject: 'Question about your {{service}}',
        body: `Hi {{firstName}},\n\nI've been researching solutions for {{problem}} and came across {{company}}. Your {{service}} looks promising.\n\nCould you share more details about how it works?\n\nThank you,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'service', 'problem', 'company', 'senderFirstName']
      },
      {
        category: 'business',
        subject: 'Industry event next month',
        body: `Hi {{firstName}},\n\nI noticed you're attending the {{event}} next month. I'll be there as well and would love to connect in person.\n\nWould you be available for coffee?\n\nRegards,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'event', 'senderFirstName']
      },
      {
        category: 'business',
        subject: 'Feedback on {{product}}',
        body: `Hi {{firstName}},\n\nI've been using {{product}} from {{company}} and wanted to share some feedback. Overall, I'm impressed with {{feature}}.\n\nWould you like to hear more detailed thoughts?\n\nBest,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'product', 'company', 'feature', 'senderFirstName']
      },
      {
        category: 'business',
        subject: 'Partnership opportunity',
        body: `Hi {{firstName}},\n\nI represent {{senderCompany}} and we're exploring partnership opportunities in the {{industry}} space.\n\nGiven {{company}}'s expertise, I believe there could be strong synergies. Would you be interested in discussing this further?\n\nBest regards,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'senderCompany', 'industry', 'company', 'senderFirstName']
      },
      {
        category: 'business',
        subject: 'Your presentation at {{event}}',
        body: `Hi {{firstName}},\n\nI attended your presentation at {{event}} and found your insights on {{topic}} very valuable.\n\nI'd love to continue the conversation if you have time.\n\nThank you,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'event', 'topic', 'senderFirstName']
      },
      {
        category: 'business',
        subject: 'Market research for {{industry}}',
        body: `Hi {{firstName}},\n\nI'm conducting research on {{industry}} trends and would greatly appreciate your perspective given your experience at {{company}}.\n\nWould you be willing to participate in a brief interview?\n\nBest,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'industry', 'company', 'senderFirstName']
      },
      {
        category: 'business',
        subject: 'Case study opportunity',
        body: `Hi {{firstName}},\n\nWe're developing a case study on successful {{topic}} implementations and {{company}} came to mind immediately.\n\nWould you be interested in being featured?\n\nRegards,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'topic', 'company', 'senderFirstName']
      },
      {
        category: 'business',
        subject: 'Request for advice on {{topic}}',
        body: `Hi {{firstName}},\n\nI'm facing a challenge with {{topic}} and remembered your expertise in this area. Would you be willing to share some advice?\n\nI'd greatly appreciate any guidance you can offer.\n\nThank you,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'topic', 'senderFirstName']
      },
      {
        category: 'business',
        subject: 'Invitation to {{event}}',
        body: `Hi {{firstName}},\n\nWe're hosting {{event}} on {{date}} and would be honored to have you join us.\n\nThe event will focus on {{topic}} and feature several industry leaders.\n\nWould you be available?\n\nBest,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'event', 'date', 'topic', 'senderFirstName']
      },
      {
        category: 'business',
        subject: 'Update on {{project}} timeline',
        body: `Hi {{firstName}},\n\nI wanted to update you on the {{project}} timeline. We're making good progress and expect to reach the next milestone by {{date}}.\n\nLet me know if you'd like more details.\n\nBest regards,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'project', 'date', 'senderFirstName']
      },
      {
        category: 'business',
        subject: 'White paper on {{topic}}',
        body: `Hi {{firstName}},\n\nWe just published a white paper on {{topic}} that includes some research relevant to {{industry}}.\n\nI thought you might find it interesting given your work at {{company}}.\n\nShall I send you a copy?\n\nCheers,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'topic', 'industry', 'company', 'senderFirstName']
      },
      {
        category: 'business',
        subject: 'Referral from {{mutualConnection}}',
        body: `Hi {{firstName}},\n\n{{mutualConnection}} recommended I connect with you regarding {{topic}}. They mentioned you have extensive experience in this area.\n\nWould you be open to a brief conversation?\n\nThank you,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'mutualConnection', 'topic', 'senderFirstName']
      },
      {
        category: 'business',
        subject: 'Industry report findings',
        body: `Hi {{firstName}},\n\nOur latest {{industry}} report revealed some surprising trends about {{specificTrend}}.\n\nGiven your role at {{company}}, I thought you'd find these insights valuable.\n\nInterested in learning more?\n\nBest,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'industry', 'specificTrend', 'company', 'senderFirstName']
      },
      {
        category: 'business',
        subject: 'Beta testing opportunity',
        body: `Hi {{firstName}},\n\nWe're launching a new {{product}} and looking for beta testers from the {{industry}} sector.\n\nGiven {{company}}'s expertise, we'd love to have your team involved.\n\nWould you be interested?\n\nRegards,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'product', 'industry', 'company', 'senderFirstName']
      },

      // ============ NETWORKING CATEGORY (25 templates) ============
      {
        category: 'networking',
        subject: 'Great meeting you at {{event}}',
        body: `Hi {{firstName}},\n\nIt was great meeting you at {{event}} last week. I really enjoyed our conversation about {{topic}}.\n\nI'd love to stay in touch and continue the discussion. Are you free for a coffee sometime?\n\nBest,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'event', 'topic', 'senderFirstName']
      },
      {
        category: 'networking',
        subject: 'Connecting on {{platform}}',
        body: `Hi {{firstName}},\n\nI came across your profile on {{platform}} and was impressed by your background in {{field}}.\n\nI'm also working in this space and would love to connect.\n\nLooking forward to staying in touch!\n\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'platform', 'field', 'senderFirstName']
      },
      {
        category: 'networking',
        subject: 'Fellow {{industry}} professional',
        body: `Hi {{firstName}},\n\nI noticed we're both working in the {{industry}} sector. I'm always interested in connecting with other professionals in this field.\n\nWould you be open to a virtual coffee chat?\n\nCheers,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'industry', 'senderFirstName']
      },
      {
        category: 'networking',
        subject: 'Your work at {{company}}',
        body: `Hi {{firstName}},\n\nI've been following {{company}}'s work in {{field}} and find it really innovative.\n\nI'd love to learn more about what you're working on and share some of my own experiences.\n\nInterested in connecting?\n\nBest,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'company', 'field', 'senderFirstName']
      },
      {
        category: 'networking',
        subject: 'Introduction from {{city}}',
        body: `Hi {{firstName}},\n\nI'm based in {{city}} and recently learned about your work in {{field}}. It would be great to connect with local professionals in this industry.\n\nWould you be interested in meeting up?\n\nRegards,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'city', 'field', 'senderFirstName']
      },
      // Continue with 20 more networking templates...
      {
        category: 'networking',
        subject: 'Alumni connection',
        body: `Hi {{firstName}},\n\nI noticed we both attended {{school}}. It's always nice to connect with fellow alumni working in {{industry}}.\n\nWould you like to catch up sometime?\n\nBest,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'school', 'industry', 'senderFirstName']
      },
      {
        category: 'networking',
        subject: 'Shared interest in {{topic}}',
        body: `Hi {{firstName}},\n\nI see we share an interest in {{topic}}. I've been exploring this area and would love to exchange ideas.\n\nWould you be open to a brief chat?\n\nCheers,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'topic', 'senderFirstName']
      },
      {
        category: 'networking',
        subject: 'Professional introduction',
        body: `Hi {{firstName}},\n\nI'm {{senderFirstName}} from {{senderCompany}}. I've been admiring your work in {{field}} and would love to connect.\n\nPerhaps we can find opportunities to collaborate in the future.\n\nBest regards,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'senderFirstName', 'senderCompany', 'field']
      },
      {
        category: 'networking',
        subject: 'Coffee chat invitation',
        body: `Hi {{firstName}},\n\nI'm always looking to expand my professional network in {{industry}}. Would you be interested in a casual coffee chat?\n\nI'd love to learn about your experience at {{company}}.\n\nBest,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'industry', 'company', 'senderFirstName']
      },
      {
        category: 'networking',
        subject: 'LinkedIn connection request',
        body: `Hi {{firstName}},\n\nI sent you a connection request on LinkedIn. I'm keen to connect with professionals in {{field}}.\n\nLooking forward to staying in touch!\n\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'field', 'senderFirstName']
      },
      {
        category: 'networking',
        subject: 'New to {{city}}',
        body: `Hi {{firstName}},\n\nI recently moved to {{city}} and am looking to build my professional network here. I noticed you're also based in {{city}} and work in {{industry}}.\n\nWould you be open to meeting for coffee?\n\nBest,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'city', 'industry', 'senderFirstName']
      },
      {
        category: 'networking',
        subject: 'Industry meetup',
        body: `Hi {{firstName}},\n\nAre you planning to attend the {{event}} next month? It would be great to meet in person and discuss trends in {{industry}}.\n\nLet me know if you'll be there!\n\nCheers,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'event', 'industry', 'senderFirstName']
      },
      {
        category: 'networking',
        subject: 'Mutual connection with {{mutualConnection}}',
        body: `Hi {{firstName}},\n\nI noticed we're both connected with {{mutualConnection}}. I'm always interested in expanding my network through mutual connections.\n\nWould you like to connect?\n\nBest,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'mutualConnection', 'senderFirstName']
      },
      {
        category: 'networking',
        subject: 'Professional community',
        body: `Hi {{firstName}},\n\nI'm part of a professional community focused on {{topic}} and thought you might be interested in joining us.\n\nWe meet monthly to share insights and experiences.\n\nInterested?\n\nRegards,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'topic', 'senderFirstName']
      },
      {
        category: 'networking',
        subject: 'Career path discussion',
        body: `Hi {{firstName}},\n\nI'm impressed by your career progression in {{industry}}. I'm currently exploring similar paths and would appreciate any insights you could share.\n\nWould you have time for a brief chat?\n\nThank you,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'industry', 'senderFirstName']
      },
      {
        category: 'networking',
        subject: 'Mastermind group invitation',
        body: `Hi {{firstName}},\n\nI'm forming a mastermind group of {{industry}} professionals and thought you'd be a great fit.\n\nWe'll meet bi-weekly to discuss challenges and opportunities.\n\nWould you be interested?\n\nBest,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'industry', 'senderFirstName']
      },
      {
        category: 'networking',
        subject: 'Conference networking',
        body: `Hi {{firstName}},\n\nI saw you're speaking at {{event}}. I'm attending as well and would love to connect before or after your session.\n\nYour topic on {{topic}} sounds fascinating.\n\nBest,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'event', 'topic', 'senderFirstName']
      },
      {
        category: 'networking',
        subject: 'Industry insights exchange',
        body: `Hi {{firstName}},\n\nI'm always looking to exchange insights with other {{industry}} professionals. Your perspective on {{topic}} would be valuable.\n\nWould you be open to a brief call?\n\nCheers,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'industry', 'topic', 'senderFirstName']
      },
      {
        category: 'networking',
        subject: 'Professional development',
        body: `Hi {{firstName}},\n\nI'm focused on professional development in {{field}} and noticed your expertise in this area.\n\nWould you be willing to share some advice?\n\nThank you,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'field', 'senderFirstName']
      },
      {
        category: 'networking',
        subject: 'Startup ecosystem',
        body: `Hi {{firstName}},\n\nI'm active in the {{city}} startup ecosystem and noticed you're also involved in this community.\n\nWould you like to connect and share experiences?\n\nBest,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'city', 'senderFirstName']
      },
      {
        category: 'networking',
        subject: 'Similar background',
        body: `Hi {{firstName}},\n\nI noticed we have similar professional backgrounds in {{field}}. It's always valuable to connect with people who've walked similar paths.\n\nWould you be interested in connecting?\n\nRegards,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'field', 'senderFirstName']
      },
      {
        category: 'networking',
        subject: 'Virtual networking',
        body: `Hi {{firstName}},\n\nIn these remote-work times, I'm making an effort to expand my virtual network. I'd love to connect with more {{industry}} professionals.\n\nWould you be open to a video call?\n\nBest,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'industry', 'senderFirstName']
      },
      {
        category: 'networking',
        subject: 'Industry association',
        body: `Hi {{firstName}},\n\nI see we're both members of {{association}}. I'm trying to be more active in the community and would love to connect with other members.\n\nShall we schedule a chat?\n\nCheers,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'association', 'senderFirstName']
      },
      {
        category: 'networking',
        subject: 'Peer connection',
        body: `Hi {{firstName}},\n\nI believe we're at similar stages in our {{industry}} careers. I find it valuable to connect with peers facing similar challenges.\n\nWould you be interested in staying in touch?\n\nBest,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'industry', 'senderFirstName']
      },
      {
        category: 'networking',
        subject: 'Knowledge sharing',
        body: `Hi {{firstName}},\n\nI'm passionate about knowledge sharing in the {{field}} community. Your insights on {{topic}} could be valuable.\n\nWould you be interested in a brief exchange?\n\nRegards,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'field', 'topic', 'senderFirstName']
      },

      // ============ FEEDBACK CATEGORY (20 templates) ============
      {
        category: 'feedback',
        subject: 'Thank you for {{service}}',
        body: `Hi {{firstName}},\n\nI wanted to take a moment to thank you for {{service}}. The experience was excellent and exceeded my expectations.\n\nKeep up the great work!\n\nBest,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'service', 'senderFirstName']
      },
      {
        category: 'feedback',
        subject: 'Positive experience with {{product}}',
        body: `Hi {{firstName}},\n\nI've been using {{product}} for {{duration}} and wanted to share some positive feedback. The {{feature}} functionality is particularly impressive.\n\nThank you for building such a great tool!\n\nBest regards,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'product', 'duration', 'feature', 'senderFirstName']
      },
      {
        category: 'feedback',
        subject: 'Suggestion for {{product}}',
        body: `Hi {{firstName}},\n\nI'm a user of {{product}} and have a suggestion that might improve the user experience: {{suggestion}}.\n\nWould you be interested in discussing this further?\n\nBest,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'product', 'suggestion', 'senderFirstName']
      },
      {
        category: 'feedback',
        subject: 'Impressed by {{feature}}',
        body: `Hi {{firstName}},\n\nI wanted to let you know how impressed I am with the {{feature}} in {{product}}. It's solved a major pain point for our team.\n\nGreat work!\n\nCheers,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'feature', 'product', 'senderFirstName']
      },
      {
        category: 'feedback',
        subject: 'Customer experience feedback',
        body: `Hi {{firstName}},\n\nI recently interacted with your team regarding {{topic}} and wanted to share feedback on the experience.\n\nYour team was {{positiveAttribute}} and very helpful.\n\nThank you!\n\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'topic', 'positiveAttribute', 'senderFirstName']
      },
      // Continue with 15 more feedback templates...
      {
        category: 'feedback',
        subject: 'Feature request for {{product}}',
        body: `Hi {{firstName}},\n\nI'm a regular user of {{product}} and would love to see {{featureRequest}} added in a future update.\n\nI believe this would benefit many users.\n\nBest,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'product', 'featureRequest', 'senderFirstName']
      },
      {
        category: 'feedback',
        subject: 'Excellent customer support',
        body: `Hi {{firstName}},\n\nI wanted to commend your support team, especially {{supportMember}}, for their excellent help with {{issue}}.\n\nThe response time and quality were outstanding.\n\nThank you,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'supportMember', 'issue', 'senderFirstName']
      },
      {
        category: 'feedback',
        subject: 'Website feedback',
        body: `Hi {{firstName}},\n\nI recently visited {{company}}'s website and wanted to share some feedback. The {{section}} is particularly well-designed.\n\nOne suggestion: {{suggestion}}.\n\nBest regards,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'company', 'section', 'suggestion', 'senderFirstName']
      },
      {
        category: 'feedback',
        subject: 'Content appreciation',
        body: `Hi {{firstName}},\n\nI regularly read your {{contentType}} on {{topic}} and find them incredibly valuable.\n\nThank you for sharing your expertise!\n\nCheers,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'contentType', 'topic', 'senderFirstName']
      },
      {
        category: 'feedback',
        subject: 'Event feedback',
        body: `Hi {{firstName}},\n\nI attended {{event}} and wanted to share how much I enjoyed it. The session on {{topic}} was particularly insightful.\n\nLooking forward to future events!\n\nBest,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'event', 'topic', 'senderFirstName']
      },
      {
        category: 'feedback',
        subject: 'Product improvement',
        body: `Hi {{firstName}},\n\nI've noticed significant improvements in {{product}} recently. The {{update}} is a game-changer.\n\nGreat job on the continuous enhancement!\n\nRegards,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'product', 'update', 'senderFirstName']
      },
      {
        category: 'feedback',
        subject: 'Documentation feedback',
        body: `Hi {{firstName}},\n\nThe documentation for {{product}} is excellent. The {{section}} section was particularly helpful when I was implementing {{feature}}.\n\nThank you for the clear guidance!\n\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'product', 'section', 'feature', 'senderFirstName']
      },
      {
        category: 'feedback',
        subject: 'Service quality',
        body: `Hi {{firstName}},\n\nI wanted to express my satisfaction with {{service}}. The quality has been consistently high over {{duration}}.\n\nKeep up the excellent work!\n\nBest,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'service', 'duration', 'senderFirstName']
      },
      {
        category: 'feedback',
        subject: 'User interface feedback',
        body: `Hi {{firstName}},\n\nThe recent UI update for {{product}} is fantastic. It's much more intuitive, especially the {{feature}} section.\n\nGreat design work!\n\nCheers,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'product', 'feature', 'senderFirstName']
      },
      {
        category: 'feedback',
        subject: 'Performance improvement',
        body: `Hi {{firstName}},\n\nI've noticed {{product}} is much faster since the last update. The {{improvement}} is particularly noticeable.\n\nThank you for the optimization!\n\nBest,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'product', 'improvement', 'senderFirstName']
      },
      {
        category: 'feedback',
        subject: 'Training session feedback',
        body: `Hi {{firstName}},\n\nThe training session on {{topic}} was excellent. The practical examples made it easy to understand and implement.\n\nThank you for organizing it!\n\nRegards,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'topic', 'senderFirstName']
      },
      {
        category: 'feedback',
        subject: 'Onboarding experience',
        body: `Hi {{firstName}},\n\nThe onboarding process for {{product}} was smooth and well-structured. The {{resource}} was particularly helpful.\n\nGreat first impression!\n\nBest,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'product', 'resource', 'senderFirstName']
      },
      {
        category: 'feedback',
        subject: 'Integration feedback',
        body: `Hi {{firstName}},\n\nThe {{integration}} with {{product}} works perfectly. The setup was straightforward and the functionality is reliable.\n\nThank you!\n\nCheers,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'integration', 'product', 'senderFirstName']
      },
      {
        category: 'feedback',
        subject: 'Mobile app feedback',
        body: `Hi {{firstName}},\n\nThe mobile app for {{product}} is excellent. The {{feature}} works seamlessly on mobile.\n\nGreat mobile experience!\n\nBest,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'product', 'feature', 'senderFirstName']
      },
      {
        category: 'feedback',
        subject: 'Community appreciation',
        body: `Hi {{firstName}},\n\nThe {{community}} community is incredibly helpful and active. I've learned so much from other members.\n\nThank you for fostering such a great community!\n\nRegards,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'community', 'senderFirstName']
      },

      // ============ COLLABORATION CATEGORY (20 templates) ============
      {
        category: 'collaboration',
        subject: 'Project collaboration opportunity',
        body: `Hi {{firstName}},\n\nI'm working on a {{projectType}} project related to {{topic}} and thought your expertise in {{field}} would be valuable.\n\nWould you be interested in collaborating?\n\nBest,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'projectType', 'topic', 'field', 'senderFirstName']
      },
      {
        category: 'collaboration',
        subject: 'Joint venture proposal',
        body: `Hi {{firstName}},\n\nI have an idea for a joint venture in the {{industry}} space that could leverage both our strengths.\n\nWould you be interested in discussing this opportunity?\n\nBest regards,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'industry', 'senderFirstName']
      },
      {
        category: 'collaboration',
        subject: 'Content collaboration',
        body: `Hi {{firstName}},\n\nI'm planning to create {{contentType}} about {{topic}} and think your insights would add great value.\n\nWould you be interested in co-creating this content?\n\nCheers,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'contentType', 'topic', 'senderFirstName']
      },
      {
        category: 'collaboration',
        subject: 'Research collaboration',
        body: `Hi {{firstName}},\n\nI'm conducting research on {{topic}} and believe our combined expertise could lead to interesting findings.\n\nWould you be interested in collaborating on this research?\n\nBest,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'topic', 'senderFirstName']
      },
      {
        category: 'collaboration',
        subject: 'Speaking opportunity',
        body: `Hi {{firstName}},\n\nI'm organizing a panel on {{topic}} for {{event}} and would love to have you as a co-speaker.\n\nYour expertise in {{field}} would be perfect for this discussion.\n\nInterested?\n\nRegards,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'topic', 'event', 'field', 'senderFirstName']
      },
      // Continue with 15 more collaboration templates...
      {
        category: 'collaboration',
        subject: 'Workshop collaboration',
        body: `Hi {{firstName}},\n\nI'm planning a workshop on {{topic}} and think we could create something valuable together.\n\nWould you be interested in co-hosting?\n\nBest,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'topic', 'senderFirstName']
      },
      {
        category: 'collaboration',
        subject: 'Product integration',
        body: `Hi {{firstName}},\n\nI believe there's potential for integration between {{product1}} and {{product2}}. This could benefit both our user bases.\n\nWould you like to explore this?\n\nCheers,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'product1', 'product2', 'senderFirstName']
      },
      {
        category: 'collaboration',
        subject: 'Event partnership',
        body: `Hi {{firstName}},\n\nWe're organizing {{event}} and would love to partner with {{company}} as a co-host.\n\nThis could be a great opportunity for both organizations.\n\nInterested in discussing?\n\nBest regards,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'event', 'company', 'senderFirstName']
      },
      {
        category: 'collaboration',
        subject: 'Guest blog opportunity',
        body: `Hi {{firstName}},\n\nWould you be interested in writing a guest blog for our audience about {{topic}}?\n\nYour expertise would provide great value to our readers.\n\nBest,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'topic', 'senderFirstName']
      },
      {
        category: 'collaboration',
        subject: 'Podcast collaboration',
        body: `Hi {{firstName}},\n\nI host a podcast on {{topic}} and would love to have you as a guest to discuss {{specificTopic}}.\n\nWould you be available for a recording?\n\nCheers,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'topic', 'specificTopic', 'senderFirstName']
      },
      {
        category: 'collaboration',
        subject: 'Cross-promotion opportunity',
        body: `Hi {{firstName}},\n\nI think there's an opportunity for cross-promotion between {{company1}} and {{company2}}.\n\nOur audiences seem highly complementary.\n\nWould you like to explore this?\n\nBest,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'company1', 'company2', 'senderFirstName']
      },
      {
        category: 'collaboration',
        subject: 'Webinar partnership',
        body: `Hi {{firstName}},\n\nWe're hosting a webinar on {{topic}} and think your participation would make it much more valuable.\n\nWould you be interested in co-presenting?\n\nRegards,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'topic', 'senderFirstName']
      },
      {
        category: 'collaboration',
        subject: 'Resource sharing',
        body: `Hi {{firstName}},\n\nI have resources on {{topic}} that might benefit your audience, and I'm sure you have valuable materials too.\n\nWould you be interested in resource sharing?\n\nBest,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'topic', 'senderFirstName']
      },
      {
        category: 'collaboration',
        subject: 'Co-marketing initiative',
        body: `Hi {{firstName}},\n\nI have an idea for a co-marketing initiative between our companies focused on {{campaign}}.\n\nWould you be interested in discussing this?\n\nCheers,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'campaign', 'senderFirstName']
      },
      {
        category: 'collaboration',
        subject: 'Strategic alliance',
        body: `Hi {{firstName}},\n\nI believe there's potential for a strategic alliance between {{company1}} and {{company2}} in the {{market}} market.\n\nWould you be open to exploring this?\n\nBest regards,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'company1', 'company2', 'market', 'senderFirstName']
      },
      {
        category: 'collaboration',
        subject: 'Joint case study',
        body: `Hi {{firstName}},\n\nOur successful implementation of {{project}} could make a great case study. Would {{company}} be interested in collaborating on this?\n\nIt would showcase both our capabilities.\n\nBest,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'project', 'company', 'senderFirstName']
      },
      {
        category: 'collaboration',
        subject: 'Community initiative',
        body: `Hi {{firstName}},\n\nI'm launching a community initiative around {{topic}} and think {{company}} would be a perfect partner.\n\nWould you like to collaborate on this?\n\nRegards,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'topic', 'company', 'senderFirstName']
      },
      {
        category: 'collaboration',
        subject: 'Technology partnership',
        body: `Hi {{firstName}},\n\nI see potential for a technology partnership where we integrate {{technology1}} with {{technology2}}.\n\nThis could create significant value for both ecosystems.\n\nInterested?\n\nBest,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'technology1', 'technology2', 'senderFirstName']
      },
      {
        category: 'collaboration',
        subject: 'Educational content',
        body: `Hi {{firstName}},\n\nWould you be interested in collaborating on educational content about {{topic}} for the {{industry}} community?\n\nWe could co-create a comprehensive guide.\n\nCheers,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'topic', 'industry', 'senderFirstName']
      },
      {
        category: 'collaboration',
        subject: 'Industry initiative',
        body: `Hi {{firstName}},\n\nI'm spearheading an industry initiative focused on {{goal}}. Given {{company}}'s leadership, your participation would be valuable.\n\nWould you like to be involved?\n\nBest regards,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'goal', 'company', 'senderFirstName']
      },

      // ============ CASUAL CATEGORY (20 templates) ============
      {
        category: 'casual',
        subject: 'Hope you\'re doing well',
        body: `Hi {{firstName}},\n\nJust wanted to check in and see how things are going. It's been a while since we last connected.\n\nHope all is well with you and {{company}}!\n\nCheers,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'company', 'senderFirstName']
      },
      {
        category: 'casual',
        subject: 'Quick hello',
        body: `Hi {{firstName}},\n\nJust dropping a quick hello. I saw your recent update about {{topic}} and wanted to reach out.\n\nHow have you been?\n\nBest,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'topic', 'senderFirstName']
      },
      {
        category: 'casual',
        subject: 'Checking in',
        body: `Hi {{firstName}},\n\nIt's been a few months since we last spoke. I wanted to check in and see how things are progressing with {{project}}.\n\nHope everything is going well!\n\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'project', 'senderFirstName']
      },
      {
        category: 'casual',
        subject: 'Staying in touch',
        body: `Hi {{firstName}},\n\nI wanted to make sure we stay in touch. It's always good to keep the connection alive.\n\nHow's everything going in {{city}}?\n\nBest,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'city', 'senderFirstName']
      },
      {
        category: 'casual',
        subject: 'Long time no talk',
        body: `Hi {{firstName}},\n\nRealized it's been a while since we last connected! Time flies.\n\nWhat have you been up to lately?\n\nCheers,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'senderFirstName']
      },
      // Continue with 15 more casual templates...
      {
        category: 'casual',
        subject: 'Catching up',
        body: `Hi {{firstName}},\n\nWould love to catch up sometime soon. Are you free for a call in the next couple of weeks?\n\nLet me know what works for you!\n\nBest,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'senderFirstName']
      },
      {
        category: 'casual',
        subject: 'How\'s it going?',
        body: `Hi {{firstName}},\n\nJust wanted to drop you a line and see how things are going. I hope {{project}} is coming along well!\n\nTalk soon,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'project', 'senderFirstName']
      },
      {
        category: 'casual',
        subject: 'Weekend plans',
        body: `Hi {{firstName}},\n\nHope you have some nice plans for the weekend! Wanted to touch base before we both get busy.\n\nLet's catch up soon.\n\nCheers,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'senderFirstName']
      },
      {
        category: 'casual',
        subject: 'Just saying hi',
        body: `Hi {{firstName}},\n\nNo particular reason for this email - just wanted to say hi and keep in touch.\n\nHope you're doing great!\n\nBest,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'senderFirstName']
      },
      {
        category: 'casual',
        subject: 'Keeping the connection',
        body: `Hi {{firstName}},\n\nI try to check in with my professional contacts periodically. How are things going with you?\n\nWould love to hear an update!\n\nRegards,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'senderFirstName']
      },
      {
        category: 'casual',
        subject: 'Friendly check-in',
        body: `Hi {{firstName}},\n\nJust a friendly check-in to see how you're doing. I hope everything is going well at {{company}}.\n\nLet me know if there's anything I can help with!\n\nBest,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'company', 'senderFirstName']
      },
      {
        category: 'casual',
        subject: 'Thinking of you',
        body: `Hi {{firstName}},\n\nI was thinking about our last conversation about {{topic}} and wanted to reach out.\n\nHow have things developed since then?\n\nCheers,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'topic', 'senderFirstName']
      },
      {
        category: 'casual',
        subject: 'Quarterly check-in',
        body: `Hi {{firstName}},\n\nAnother quarter has flown by! Just wanted to check in and see how things are progressing.\n\nHope all is well!\n\nBest,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'senderFirstName']
      },
      {
        category: 'casual',
        subject: 'Maintaining connection',
        body: `Hi {{firstName}},\n\nI like to stay connected with professionals I've met. Just wanted to drop a line and see how you're doing.\n\nBest wishes,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'senderFirstName']
      },
      {
        category: 'casual',
        subject: 'Hope all is well',
        body: `Hi {{firstName}},\n\nHope this email finds you well. I've been meaning to reach out and see how everything is going.\n\nLet's catch up soon!\n\nCheers,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'senderFirstName']
      },
      {
        category: 'casual',
        subject: 'Reconnecting',
        body: `Hi {{firstName}},\n\nIt's been too long! I wanted to reconnect and hear what you've been working on lately.\n\nWould love to catch up!\n\nBest,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'senderFirstName']
      },
      {
        category: 'casual',
        subject: 'End of year check-in',
        body: `Hi {{firstName}},\n\nAs the year winds down, I wanted to reach out and see how things went for you. Any exciting plans for next year?\n\nBest regards,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'senderFirstName']
      },
      {
        category: 'casual',
        subject: 'New year, staying connected',
        body: `Hi {{firstName}},\n\nHappy new year! I wanted to make sure we stay connected as we head into {{year}}.\n\nWhat are your goals for this year?\n\nCheers,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'year', 'senderFirstName']
      },
      {
        category: 'casual',
        subject: 'Seasonal greetings',
        body: `Hi {{firstName}},\n\nSending seasonal greetings your way! Hope you're doing well and enjoying {{season}}.\n\nLet's catch up soon!\n\nBest,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'season', 'senderFirstName']
      },
      {
        category: 'casual',
        subject: 'Random thought of you',
        body: `Hi {{firstName}},\n\nI had a random thought of you today and wanted to reach out. How have you been?\n\nWould love to hear what you're up to!\n\nCheers,\n{{senderFirstName}}`,
        language: 'en',
        variables: ['firstName', 'senderFirstName']
      }
    ];

    let createdCount = 0;
    let skippedCount = 0;

    for (const templateData of templates) {
      const [template, created] = await WarmupTemplate.findOrCreate({
        where: {
          category: templateData.category,
          subject: templateData.subject
        },
        defaults: templateData
      });

      if (created) {
        createdCount++;
        logger.info(` Template created: ${template.category} - ${template.subject}`);
      } else {
        skippedCount++;
      }
    }

    logger.info(` Templates seeded: ${createdCount} created, ${skippedCount} already exist`);
    logger.info(`=ç Total templates in database: ${templates.length}`);
  } catch (error: any) {
    logger.error('Failed to seed templates', { error: error.message });
    throw error;
  }
};

// Run seed if this file is executed directly
if (require.main === module) {
  const { sequelize } = require('../config/database');

  sequelize.authenticate()
    .then(() => seedTemplates())
    .then(() => {
      logger.info('Templates seed completed');
      process.exit(0);
    })
    .catch((error: any) => {
      logger.error('Templates seed failed', { error: error.message });
      process.exit(1);
    });
}
