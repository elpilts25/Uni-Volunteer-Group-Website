import DOMPurify from 'dompurify';

// Formatted posts are stored as HTML; older posts are plain text.
const HTML_START = /^\s*<(p|h[1-6]|ul|ol|blockquote|pre)[\s>]/i;
export const looksLikeHtml = (text) => HTML_START.test(text);

const ALLOWED_TAGS = [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'del', 'code', 'pre', 'blockquote',
    'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'a',
];

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A') {
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener noreferrer nofollow');
    }
});

export const sanitizeHtml = (html) => DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ['href', 'target', 'rel'],
});

const escapeHtml = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Turns a stored post into HTML the editor can load.
export const toEditorHtml = (content) => (looksLikeHtml(content)
    ? content
    : content.split('\n').map((line) => `<p>${escapeHtml(line)}</p>`).join(''));
