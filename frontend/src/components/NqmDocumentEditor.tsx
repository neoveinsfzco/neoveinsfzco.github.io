import React, { useEffect } from 'react';
import {
  Box,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Divider,
  Stack,
  TextField,
} from '@mui/material';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import type { Level } from '@tiptap/extension-heading';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import Image from '@tiptap/extension-image';
import { Extension } from '@tiptap/core';

import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import FormatAlignJustifyIcon from '@mui/icons-material/FormatAlignJustify';
import BorderAllIcon from '@mui/icons-material/BorderAll';
import BorderClearIcon from '@mui/icons-material/BorderClear';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FormatColorTextIcon from '@mui/icons-material/FormatColorText';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import FormatColorFillIcon from '@mui/icons-material/FormatColorFill';
import ImageIcon from '@mui/icons-material/Image';
import PaletteIcon from '@mui/icons-material/Palette';

interface NqmDocumentEditorProps {
  value: string;
  onChange: (html: string) => void;
}

/**
 * Add support for fontSize (in px) via TextStyle’s global attributes.
 */
const FontSizeExtension = Extension.create({
  name: 'fontSize',
  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element: HTMLElement) => {
              const size = element.style.fontSize || '';
              if (!size) return null;
              // expect something like "16px"
              return size.replace('px', '');
            },
            renderHTML: (attrs: any) => {
              if (!attrs.fontSize) return {};
              return {
                style: `font-size: ${attrs.fontSize}px`,
              };
            },
          },
        },
      },
    ];
  },
});

/**
 * Extend TableCell to support backgroundColor + borderColor.
 * We render both styles together from backgroundColor’s renderHTML.
 */
const CustomTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: {
        default: null,
        parseHTML: (element: HTMLElement) =>
          element.getAttribute('data-background-color') ||
          element.style.backgroundColor ||
          null,
        renderHTML: (attrs: any) => {
          const styleParts: string[] = [];
          if (attrs.backgroundColor) {
            styleParts.push(`background-color: ${attrs.backgroundColor}`);
          }
          if (attrs.borderColor) {
            styleParts.push(`border-color: ${attrs.borderColor}`);
          }

          if (!styleParts.length) return {};

          const htmlAttrs: Record<string, string> = {
            style: styleParts.join('; '),
          };
          if (attrs.backgroundColor) {
            htmlAttrs['data-background-color'] = attrs.backgroundColor;
          }
          if (attrs.borderColor) {
            htmlAttrs['data-border-color'] = attrs.borderColor;
          }
          return htmlAttrs;
        },
      },
      borderColor: {
        default: null,
        parseHTML: (element: HTMLElement) =>
          element.getAttribute('data-border-color') ||
          element.style.borderColor ||
          null,
        // render handled by backgroundColor.renderHTML
        renderHTML: () => ({}),
      },
    };
  },
});

/**
 * Extend Image to support a width attribute (e.g. 400px or 50%).
 */
const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element: HTMLElement) => element.style.width || null,
        renderHTML: (attrs: any) => {
          if (!attrs.width) return {};
          return {
            style: `width: ${attrs.width};`,
          };
        },
      },
    };
  },
});

export const NqmDocumentEditor: React.FC<NqmDocumentEditorProps> = ({
  value,
  onChange,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextStyle,
      Color,
      Link.configure({
        openOnClick: false,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      CustomTableCell,
      FontSizeExtension,
      CustomImage.configure({
        inline: false,
        allowBase64: true,
      }),
    ],
    content: value || '<p></p>',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
  });

  // Keep editor in sync with external value (e.g., when loading existing version)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '<p></p>', { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) return null;

  const handleHeadingChange = (
    _event: React.MouseEvent<HTMLElement>,
    newValue: string | null,
  ) => {
    if (!newValue) return;
    if (newValue === 'paragraph') {
      editor.chain().focus().setParagraph().run();
    } else {
      const level = Number(newValue.replace('h', '')) as Level;
      editor.chain().focus().toggleHeading({ level }).run();
    }
  };

  const handleAlignChange = (
    _event: React.MouseEvent<HTMLElement>,
    newValue: string | null,
  ) => {
    if (!newValue) return;
    editor.chain().focus().setTextAlign(newValue as any).run();
  };

  const insertPageBreak = () => {
    editor
      .chain()
      .focus()
      .insertContent(
        '<p style="page-break-after: always;"><span style="color:#999;">— Page Break —</span></p>',
      )
      .run();
  };

  const insertTable = () => {
    const rowsRaw = window.prompt('Number of rows?', '3');
    const colsRaw = window.prompt('Number of columns?', '3');

    const rows = rowsRaw ? parseInt(rowsRaw, 10) : 3;
    const cols = colsRaw ? parseInt(colsRaw, 10) : 3;

    if (!rows || !cols || rows <= 0 || cols <= 0) return;

    editor
      .chain()
      .focus()
      .insertTable({ rows, cols, withHeaderRow: true })
      .run();
  };

  const clearFormatting = () => {
    editor.chain().focus().clearNodes().unsetAllMarks().run();
  };

  const copyAsHtmlToClipboard = async () => {
    const html = editor.getHTML();
    try {
      await navigator.clipboard.writeText(html);
    } catch (e) {
      console.warn('Clipboard not available', e);
    }
  };

  const changeCellBackground = (color: string) => {
    try {
      editor
        .chain()
        .focus()
        .setCellAttribute('backgroundColor', color)
        .run();
    } catch (e) {
      console.warn('Not inside a table cell', e);
    }
  };

  const changeCellBorderColor = (color: string) => {
    try {
      editor
        .chain()
        .focus()
        .setCellAttribute('borderColor', color)
        .run();
    } catch (e) {
      console.warn('Not inside a table cell', e);
    }
  };

  const insertImageFromFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        // Ask user for width
        const widthRaw =
          window.prompt(
            'Image width (e.g. 400px or 50%)',
            '400px',
          ) || '';

        let width: string | null = null;
        const trimmed = widthRaw.trim();

        if (trimmed) {
          if (/^\d+$/.test(trimmed)) {
            // numeric -> px
            width = `${trimmed}px`;
          } else {
            width = trimmed; // assume user includes unit (px, %, etc.)
          }
        }

        editor
          .chain()
          .focus()
          .setImage({
            src: result,
            alt: file.name,
            width: width || undefined,
          } as any)
          .run();
      }
    };
    reader.readAsDataURL(file);
  };

  // Current font size from selection (if any)
  const currentFontSize =
    (editor.getAttributes('textStyle') as any)?.fontSize || '';

  const handleFontSizeChange = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) {
      // remove font size
      editor
        .chain()
        .focus()
        .setMark('textStyle', { fontSize: null })
        .run();
      return;
    }
    const num = parseInt(trimmed, 10);
    if (Number.isNaN(num) || num <= 0) return;
    editor
      .chain()
      .focus()
      .setMark('textStyle', { fontSize: num })
      .run();
  };

  return (
    <Box
      sx={{
        borderRadius: 2,
        border: (t) => `1px solid ${t.palette.divider}`,
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 400,
      }}
    >
      {/* Toolbar */}
      <Box
        sx={{
          px: 1,
          py: 0.5,
          borderBottom: (t) => `1px solid ${t.palette.divider}`,
          bgcolor: (t) =>
            t.palette.mode === 'light'
              ? 'grey.50'
              : 'rgba(255,255,255,0.04)',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1}
          alignItems="center"
          justifyContent="space-between"
        >
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
          >
            {/* Heading selector (bigger headers styled below) */}
            <ToggleButtonGroup
              size="small"
              exclusive
              onChange={handleHeadingChange}
            >
              <ToggleButton value="paragraph">
                <span style={{ fontSize: 12 }}>Normal</span>
              </ToggleButton>
              <ToggleButton value="h1">
                <span style={{ fontSize: 12 }}>H1</span>
              </ToggleButton>
              <ToggleButton value="h2">
                <span style={{ fontSize: 12 }}>H2</span>
              </ToggleButton>
              <ToggleButton value="h3">
                <span style={{ fontSize: 12 }}>H3</span>
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Font size (px) */}
            <TextField
              label="Font px"
              variant="outlined"
              size="small"
              type="number"
              value={currentFontSize || ''}
              onChange={(e) => handleFontSizeChange(e.target.value)}
              sx={{
                width: 90,
                ml: 1,
                '& .MuiInputBase-input': {
                  fontSize: 12,
                  textAlign: 'center',
                  paddingY: 0.5,
                },
                '& .MuiInputLabel-root': {
                  fontSize: 11,
                },
              }}
              inputProps={{ min: 8, max: 72 }}
            />

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

            {/* Bold / italic / underline */}
            <Tooltip title="Bold">
              <IconButton
                size="small"
                onClick={() =>
                  editor.chain().focus().toggleBold().run()
                }
                color={editor.isActive('bold') ? 'primary' : 'default'}
              >
                <FormatBoldIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Italic">
              <IconButton
                size="small"
                onClick={() =>
                  editor.chain().focus().toggleItalic().run()
                }
                color={editor.isActive('italic') ? 'primary' : 'default'}
              >
                <FormatItalicIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Underline">
              <IconButton
                size="small"
                onClick={() =>
                  editor.chain().focus().toggleUnderline().run()
                }
                color={editor.isActive('underline') ? 'primary' : 'default'}
              >
                <FormatUnderlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

            {/* Lists */}
            <Tooltip title="Bulleted list">
              <IconButton
                size="small"
                onClick={() =>
                  editor.chain().focus().toggleBulletList().run()
                }
                color={
                  editor.isActive('bulletList') ? 'primary' : 'default'
                }
              >
                <FormatListBulletedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Numbered list">
              <IconButton
                size="small"
                onClick={() =>
                  editor.chain().focus().toggleOrderedList().run()
                }
                color={
                  editor.isActive('orderedList') ? 'primary' : 'default'
                }
              >
                <FormatListNumberedIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

            {/* Alignment */}
            <ToggleButtonGroup
              size="small"
              exclusive
              onChange={handleAlignChange}
            >
              <ToggleButton value="left">
                <FormatAlignLeftIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value="center">
                <FormatAlignCenterIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value="right">
                <FormatAlignRightIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value="justify">
                <FormatAlignJustifyIcon fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

            {/* Text color */}
            <Tooltip title="Text color">
              <IconButton size="small" component="label">
                <FormatColorTextIcon fontSize="small" />
                <input
                  type="color"
                  hidden
                  onChange={(e) =>
                    editor
                      .chain()
                      .focus()
                      .setColor(e.target.value)
                      .run()
                  }
                />
              </IconButton>
            </Tooltip>

            <Tooltip title="Insert horizontal rule">
              <IconButton
                size="small"
                onClick={() =>
                  editor.chain().focus().setHorizontalRule().run()
                }
              >
                <HorizontalRuleIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

            {/* Tables & page break */}
            <Tooltip title="Insert table">
              <IconButton size="small" onClick={insertTable}>
                <BorderAllIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Remove table (if cursor inside)">
              <IconButton
                size="small"
                onClick={() =>
                  editor.chain().focus().deleteTable().run()
                }
              >
                <BorderClearIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Cell background color */}
            <Tooltip title="Cell background (cursor in cell)">
              <IconButton size="small" component="label">
                <FormatColorFillIcon fontSize="small" />
                <input
                  type="color"
                  hidden
                  onChange={(e) =>
                    changeCellBackground(e.target.value)
                  }
                />
              </IconButton>
            </Tooltip>

            {/* Cell border color */}
            <Tooltip title="Cell border color (cursor in cell)">
              <IconButton size="small" component="label">
                <PaletteIcon fontSize="small" />
                <input
                  type="color"
                  hidden
                  onChange={(e) =>
                    changeCellBorderColor(e.target.value)
                  }
                />
              </IconButton>
            </Tooltip>

            {/* Page break */}
            <Tooltip title="Insert page break">
              <IconButton size="small" onClick={insertPageBreak}>
                <FileDownloadIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

            {/* Image insert with size control */}
            <Tooltip title="Insert image">
              <IconButton size="small" component="label">
                <ImageIcon fontSize="small" />
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      insertImageFromFile(file);
                      e.target.value = '';
                    }
                  }}
                />
              </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

            {/* Clear formatting / copy-html */}
            <Tooltip title="Clear formatting">
              <IconButton size="small" onClick={clearFormatting}>
                <ContentCopyIcon
                  fontSize="small"
                  style={{ transform: 'rotate(180deg)' }}
                />
              </IconButton>
            </Tooltip>
            <Tooltip title="Copy HTML to clipboard">
              <IconButton
                size="small"
                onClick={copyAsHtmlToClipboard}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>

          {/* small indicator of HTML size */}
          <TextField
            variant="outlined"
            size="small"
            value={`${editor.getHTML().length} chars`}
            InputProps={{ readOnly: true }}
            sx={{
              maxWidth: 140,
              '& .MuiInputBase-input': {
                fontSize: 11,
                textAlign: 'right',
              },
            }}
          />
        </Stack>
      </Box>

      {/* Editor body */}
      <Box
        sx={{
          flex: 1,
          p: 2,
          bgcolor: 'background.paper',
          '& .ProseMirror': {
            minHeight: 350,
            outline: 'none',
            fontSize: 14,
            lineHeight: 1.5,
          },
          // Bigger headers
          '& .ProseMirror h1': {
            fontSize: 28,
            fontWeight: 700,
            marginBottom: 1,
          },
          '& .ProseMirror h2': {
            fontSize: 24,
            fontWeight: 600,
            marginBottom: 1,
          },
          '& .ProseMirror h3': {
            fontSize: 20,
            fontWeight: 600,
            marginBottom: 1,
          },
          '& .ProseMirror table': {
            borderCollapse: 'collapse',
            width: '100%',
          },
          '& .ProseMirror th, .ProseMirror td': {
            border: '1px solid rgba(148,163,184,0.6)',
            padding: '4px 6px',
            fontSize: 13,
          },
          '& .ProseMirror img': {
            maxWidth: '100%',
            height: 'auto',
            display: 'block',
            margin: '8px 0',
          },
        }}
      >
        <EditorContent editor={editor} />
      </Box>
    </Box>
  );
};
