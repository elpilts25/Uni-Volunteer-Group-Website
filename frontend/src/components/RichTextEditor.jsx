import PropTypes from 'prop-types';
import { Box, Divider, IconButton, Tooltip } from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import StrikethroughSIcon from '@mui/icons-material/StrikethroughS';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import LinkIcon from '@mui/icons-material/Link';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extensions';
import { useTranslations } from '../i18n/i18n';

function ToolButton({ label, icon: Icon, active, disabled, onClick }) {
    return (
        <Tooltip title={label}>
            <span>
                <IconButton
                    size="small" aria-label={label} aria-pressed={active} disabled={disabled}
                    // Keeps the text selection in the editor while a button is pressed.
                    onMouseDown={(e) => e.preventDefault()} onClick={onClick}
                    sx={{
                        borderRadius: 1.5,
                        color: active ? 'var(--accent-fg)' : 'inherit',
                        bgcolor: active ? 'var(--accent-bg)' : 'transparent',
                    }}
                >
                    <Icon fontSize="small" />
                </IconButton>
            </span>
        </Tooltip>
    );
}

ToolButton.propTypes = {
    label: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
    active: PropTypes.bool,
    disabled: PropTypes.bool,
    onClick: PropTypes.func.isRequired,
};

// `value` is only read on mount; remount with a new `key` to load different content.
function RichTextEditor({ value, onChange, placeholder, ariaLabel, minHeight = 240, autoFocus }) {
    const { t } = useTranslations('richText');
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [2, 3] },
                link: { openOnClick: false, autolink: true },
            }),
            Placeholder.configure({ placeholder }),
        ],
        content: value,
        autofocus: autoFocus ? 'end' : false,
        editorProps: { attributes: { 'aria-label': ariaLabel ?? '', role: 'textbox', 'aria-multiline': 'true' } },
        onUpdate: ({ editor: ed }) => onChange(ed.isEmpty ? '' : ed.getHTML()),
    });

    const state = useEditorState({
        editor,
        selector: ({ editor: ed }) => ({
            bold: ed.isActive('bold'),
            italic: ed.isActive('italic'),
            underline: ed.isActive('underline'),
            strike: ed.isActive('strike'),
            bulletList: ed.isActive('bulletList'),
            orderedList: ed.isActive('orderedList'),
            blockquote: ed.isActive('blockquote'),
            link: ed.isActive('link'),
            canUndo: ed.can().undo(),
            canRedo: ed.can().redo(),
        }),
    });

    const setLink = () => {
        const url = window.prompt(t('linkPrompt'), editor.getAttributes('link').href ?? '');
        if (url === null) return;
        const chain = editor.chain().focus().extendMarkRange('link');
        if (url.trim() === '') chain.unsetLink().run();
        else chain.setLink({ href: url.trim() }).run();
    };

    const run = (command) => () => command(editor.chain().focus()).run();

    return (
        <Box
            className="rich-editor"
            sx={{
                border: '1px solid var(--outline-strong)', borderRadius: 3, bgcolor: 'var(--card-alt)',
                overflow: 'hidden', '--editor-min-height': `${minHeight}px`,
                '&:focus-within': { borderColor: 'primary.main', boxShadow: '0 0 0 1px var(--accent-fg)' },
            }}
        >
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.25, px: 1, py: 0.5 }}>
                <ToolButton label={t('bold')} icon={FormatBoldIcon} active={state.bold} onClick={run((c) => c.toggleBold())} />
                <ToolButton label={t('italic')} icon={FormatItalicIcon} active={state.italic} onClick={run((c) => c.toggleItalic())} />
                <ToolButton
                    label={t('underline')} icon={FormatUnderlinedIcon} active={state.underline}
                    onClick={run((c) => c.toggleUnderline())}
                />
                <ToolButton label={t('strike')} icon={StrikethroughSIcon} active={state.strike} onClick={run((c) => c.toggleStrike())} />
                <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />
                <ToolButton
                    label={t('bulletList')} icon={FormatListBulletedIcon} active={state.bulletList}
                    onClick={run((c) => c.toggleBulletList())}
                />
                <ToolButton
                    label={t('orderedList')} icon={FormatListNumberedIcon} active={state.orderedList}
                    onClick={run((c) => c.toggleOrderedList())}
                />
                <ToolButton label={t('quote')} icon={FormatQuoteIcon} active={state.blockquote} onClick={run((c) => c.toggleBlockquote())} />
                <ToolButton label={t('link')} icon={LinkIcon} active={state.link} onClick={setLink} />
                <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />
                <ToolButton label={t('undo')} icon={UndoIcon} disabled={!state.canUndo} onClick={run((c) => c.undo())} />
                <ToolButton label={t('redo')} icon={RedoIcon} disabled={!state.canRedo} onClick={run((c) => c.redo())} />
            </Box>
            <Divider sx={{ borderColor: 'var(--outline-strong)' }} />
            <EditorContent editor={editor} />
        </Box>
    );
}

RichTextEditor.propTypes = {
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    placeholder: PropTypes.string,
    ariaLabel: PropTypes.string,
    minHeight: PropTypes.number,
    autoFocus: PropTypes.bool,
};

export default RichTextEditor;
