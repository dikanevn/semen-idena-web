/* eslint-disable react/prop-types */
import React, {createRef, useRef, useCallback, useState} from 'react'
import Jimp from 'jimp'
import {useTranslation} from 'react-i18next'
import mousetrap from 'mousetrap'
import {
  Box,
  Flex,
  Stack,
  Text,
  VisuallyHidden,
  useToast,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  SimpleGrid,
  Portal,
  IconButton,
  Button,
  useTheme,
  Divider,
  useDisclosure,
} from '@chakra-ui/react'
import {SearchIcon} from '@chakra-ui/icons'
import {useInterval} from '../../../shared/hooks/use-interval'
import {
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
  Toast,
  Tooltip,
} from '../../../shared/components/components'
import {resizing, imageResize, imageResizeSoft} from '../../../shared/utils/img'
import {writeImageURLToClipboard} from '../../../shared/utils/clipboard'
import {ImageSearchDialog} from './image-search'
import {
  AddImageIcon,
  ClipboardIcon,
  CropIcon,
  DrawIcon,
  EraserIcon,
  BasketIcon,
  FolderIcon,
  RedoIcon,
  UndoIcon,
  CopyIcon,
  DeleteIcon,
  LockedImageIcon,
} from '../../../shared/components/icons'
import {useSuccessToast} from '../../../shared/hooks/use-toast'
import {rem} from '../../../shared/theme'
import {colorPickerColor} from '../utils'

const ImageEditor =
  typeof window !== 'undefined'
    ? require('@toast-ui/react-image-editor').default
    : null

const BottomMenu = {
  Main: 0,
  Crop: 1,
  Erase: 2,
  None: 3,
}

const RightMenu = {
  None: 0,
  FreeDrawing: 1,
  Erase: 2,
}

const IMAGE_WIDTH = 440
const IMAGE_HEIGHT = 330
const INSERT_OBJECT_IMAGE = 1
const INSERT_BACKGROUND_IMAGE = 2
const BLANK_IMAGE_DATAURL =
  'data:image/png;base64,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'

export default function FlipEditor({
  idx = 0,
  src,
  visible,
  adversarialId,
  onChange,
  onChanging,
  onChangeAdversarial,
}) {
  const {t} = useTranslation()
  const toast = useToast()

  const [blankImage, setBlankImage] = useState(BLANK_IMAGE_DATAURL)

  // Context menu
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [contextMenuCursor, setContextMenuCursor] = useState({x: 0, y: 0})

  const [bottomMenuPanel, setBottomMenuPanel] = useState(
    idx === adversarialId ? BottomMenu.None : BottomMenu.Main
  )
  const [rightMenuPanel, setRightMenuPanel] = useState(RightMenu.None)

  const [brush, setBrush] = useState(20)
  const [brushColor, setBrushColor] = useState('ff6666dd')
  const [showArrowHint, setShowArrowHint] = useState(
    !src && idx === 0 && idx !== adversarialId
  )

  const theme = useTheme()

  // Editors
  const editorRefs = useRef([
    createRef(),
    createRef(),
    createRef(),
    createRef(),
  ])
  const uploaderRef = useRef()
  const [editors, setEditors] = useState([null, null, null, null])
  const setEditor = (k, e) => {
    if (e) {
      setEditors([...editors.slice(0, k), e, ...editors.slice(k + 1)])
    }
  }

  const [isSelectionCreated, setIsSelectionCreated] = useState(null)
  const [activeObjectUrl, setActiveObjectUrl] = useState(null)
  const [activeObjectId, setActiveObjectId] = useState(null)

  // Postponed onChange() triggering
  const NOCHANGES = 0
  const NEWCHANGES = 1
  const CHANGED = 5

  const [changesCnt, setChangesCnt] = useState(NOCHANGES)
  const handleOnChanging = useCallback(() => {
    if (changesCnt === -1) return
    onChanging(idx)
    if (!changesCnt) setChangesCnt(1)
  }, [changesCnt, idx, onChanging])

  const handleOnChanged = useCallback(() => {
    setChangesCnt(CHANGED)
  }, [])

  useInterval(() => {
    if (changesCnt >= NEWCHANGES) {
      setShowArrowHint(false)
      setChangesCnt(changesCnt + 1)
    }
    if (changesCnt >= CHANGED) {
      setChangesCnt(NOCHANGES)
      const url = editors[idx].toDataURL()
      onChange(url)
    }
  }, 200)

  const [insertImageMode, setInsertImageMode] = useState(0)

  const setImageUrl = useCallback(
    (data, onDone = null) => {
      const {url, insertMode, customEditor} = data
      const nextInsertMode = insertMode || insertImageMode
      const editor = customEditor || editors[idx]

      if (!editor) return

      if (!url) {
        editor.loadImageFromURL(blankImage, 'blank').then(() => {
          setChangesCnt(NOCHANGES)
          onChange(null)
        })
        return
      }

      if (nextInsertMode === INSERT_OBJECT_IMAGE) {
        setChangesCnt(NOCHANGES)

        let replaceObjectProps
        if (data.replaceObjectId) {
          replaceObjectProps = editors[
            idx
          ].getObjectProperties(data.replaceObjectId, ['left', 'top', 'angle'])
          editors[idx].execute('removeObject', data.replaceObjectId)
        }
        Jimp.read(url).then(image => {
          image.getBase64Async('image/png').then(async nextUrl => {
            const resizedNextUrl = await imageResizeSoft(
              nextUrl,
              IMAGE_WIDTH,
              IMAGE_HEIGHT
            )
            editor.addImageObject(resizedNextUrl).then(objectProps => {
              if (data.replaceObjectId) {
                editors[idx].setObjectPropertiesQuietly(
                  objectProps.id,
                  replaceObjectProps
                )
              }

              handleOnChanged()
              setActiveObjectId(objectProps.id)
              setActiveObjectUrl(resizedNextUrl)

              if (onDone) onDone()

              if (editors[idx]._graphics) {
                editors[idx]._graphics.renderAll()
              }
            })
          })
        })
      }

      if (nextInsertMode === INSERT_BACKGROUND_IMAGE) {
        editor.loadImageFromURL(blankImage, 'blank').then(() => {
          editor.addImageObject(url).then(objectProps => {
            const {id} = objectProps
            const {width, height} = editor.getObjectProperties(id, [
              'left',
              'top',
              'width',
              'height',
            ])
            const {newWidth, newHeight} = resizing(
              width,
              height,
              IMAGE_WIDTH,
              IMAGE_HEIGHT,
              false
            )
            editor.setObjectPropertiesQuietly(id, {
              left: IMAGE_WIDTH / 2 + Math.random() * 200 - 400,
              top: IMAGE_HEIGHT / 2 + Math.random() * 200 - 400,
              width: newWidth * 10,
              height: newHeight * 10,
              opacity: 0.5,
            })
            editor.loadImageFromURL(editor.toDataURL(), 'BlurBkgd').then(() => {
              editor.addImageObject(url).then(objectProps2 => {
                const {id: id2} = objectProps2

                editor.setObjectPropertiesQuietly(id2, {
                  left: IMAGE_WIDTH / 2,
                  top: IMAGE_HEIGHT / 2,
                  scaleX: newWidth / width,
                  scaleY: newHeight / height,
                })
                editor.loadImageFromURL(editor.toDataURL(), 'Bkgd').then(() => {
                  editor.clearUndoStack()
                  editor.clearRedoStack()
                  handleOnChanged()
                  if (onDone) onDone()

                  if (editors[idx]._graphics) {
                    editors[idx]._graphics.renderAll()
                  }
                })
              })
            })
          })
        })
      }
    },
    [blankImage, editors, handleOnChanged, idx, insertImageMode, onChange]
  )

  const [showImageSearch, setShowImageSearch] = React.useState()

  const {
    isOpen: isOpenModal,
    onOpen: onOpenModal,
    onClose: onCloseModal,
  } = useDisclosure()

  // File upload handling
  const handleUpload = e => {
    e.preventDefault()
    const file = e.target.files[0]
    if (!file || !file.type.startsWith('image')) {
      return
    }
    const reader = new FileReader()
    reader.addEventListener('loadend', async re => {
      const url = await imageResizeSoft(
        re.target.result,
        IMAGE_WIDTH,
        IMAGE_HEIGHT
      )
      setImageUrl({url})
      setInsertImageMode(0)
    })
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleImageFromClipboard = async (
    insertMode = INSERT_BACKGROUND_IMAGE
  ) => {
    const list = await navigator.clipboard.read()
    let type
    const item = list.find(listItem =>
      listItem.types.some(itemType => {
        if (itemType.startsWith('image/')) {
          type = itemType
          return true
        }
        return false
      })
    )
    const blob = item && (await item.getType(type))

    if (blob) {
      const reader = new FileReader()
      reader.addEventListener('loadend', async re => {
        setImageUrl({url: re.target.result, insertMode})
      })
      reader.readAsDataURL(blob)
    }
  }

  const successToast = useSuccessToast()

  const handleOnCopy = () => {
    const url = activeObjectUrl || (editors[idx] && editors[idx].toDataURL())
    if (url) {
      writeImageURLToClipboard(url).then(() =>
        successToast({
          title: t('Copied'),
        })
      )
    }
  }

  const handleOnPaste = () => {
    setShowContextMenu(false)
    if (idx !== adversarialId) {
      handleImageFromClipboard()
    }
  }

  const handleUndo = () => {
    if (editors[idx]) {
      editors[idx].undo().then(() => {
        setChangesCnt(NOCHANGES)
        handleOnChanged()
      })
    }
  }

  const handleRedo = () => {
    if (editors[idx]) {
      editors[idx].redo().then(() => {
        setChangesCnt(NOCHANGES)
        handleOnChanged()
      })
    }
  }

  const handleOnDelete = () => {
    if (editors[idx]) {
      setShowContextMenu(false)
      editors[idx].removeActiveObject()
      setChangesCnt(NOCHANGES)
      handleOnChanged()
    }
  }

  const handleOnClear = () => {
    if (rightMenuPanel === RightMenu.Erase) {
      setRightMenuPanel(RightMenu.None)
    }
    if (adversarialId === -1) {
      onChangeAdversarial(idx)
      setBottomMenuPanel(BottomMenu.None)
      setShowArrowHint(false)
      setChangesCnt(changesCnt + 1)
    }
    setImageUrl({url: null})
  }

  if (visible) {
    mousetrap.bind(['command+v', 'ctrl+v'], function(e) {
      handleOnPaste()
      e.stopImmediatePropagation()
      return false
    })

    mousetrap.bind(['command+c', 'ctrl+c'], function(e) {
      handleOnCopy()
      e.stopImmediatePropagation()
      return false
    })

    mousetrap.bind(['command+z', 'ctrl+z'], function(e) {
      handleUndo()
      e.stopImmediatePropagation()
      return false
    })

    mousetrap.bind(['shift+ctrl+z', 'shift+command+z'], function(e) {
      handleRedo()
      e.stopImmediatePropagation()
      return false
    })
  }

  function getEditorInstance() {
    const editor =
      editorRefs.current[idx] &&
      editorRefs.current[idx].current &&
      editorRefs.current[idx].current.getInstance()
    return editor
  }

  function getEditorActiveObjectId(editor) {
    const objId =
      editor &&
      editor._graphics &&
      editor._graphics._canvas &&
      editor._graphics._canvas._activeObject &&
      editor._graphics._canvas._activeObject.__fe_id
    return objId
  }

  function getEditorObjectUrl(editor, objId) {
    const obj =
      objId && editor && editor._graphics && editor._graphics._objects[objId]
    const url = obj && obj._element && obj._element.src

    return url
  }

  function getEditorObjectProps(editor, objId) {
    const obj =
      objId && editor && editor._graphics && editor._graphics._objects[objId]
    if (obj) {
      return {
        x: obj.left,
        y: obj.top,
        width: obj.width,
        height: obj.height,
        angle: obj.angle,
        scaleX: obj.scaleX,
        scaleY: obj.scaleY,
      }
    }
    return null
  }

  // init editor
  React.useEffect(() => {
    const updateEvents = e => {
      if (!e) return
      e.on({
        mousedown() {
          setShowContextMenu(false)

          const editor = getEditorInstance()
          const objId = getEditorActiveObjectId(editor)
          const url = getEditorObjectUrl(editor, objId)

          setActiveObjectId(objId)
          setActiveObjectUrl(url)

          if (e.getDrawingMode() === 'FREE_DRAWING') {
            setChangesCnt(NOCHANGES)
          }
        },
      })

      e.on({
        objectMoved() {
          handleOnChanging()
        },
      })
      e.on({
        objectRotated() {
          handleOnChanging()
        },
      })
      e.on({
        objectScaled() {
          handleOnChanging()
        },
      })
      e.on({
        undoStackChanged() {
          const editor = getEditorInstance()
          const objId = getEditorActiveObjectId(editor)
          const url = getEditorObjectUrl(editor, objId)

          setActiveObjectId(objId)
          setActiveObjectUrl(url)

          handleOnChanging()
        },
      })
      e.on({
        redoStackChanged() {
          const editor = getEditorInstance()
          const objId = getEditorActiveObjectId(editor)
          const url = getEditorObjectUrl(editor, objId)

          setActiveObjectId(objId)
          setActiveObjectUrl(url)

          handleOnChanging()
        },
      })
      e.on({
        objectActivated() {
          //
        },
      })

      e.on({
        selectionCreated() {
          setIsSelectionCreated(true)
        },
      })

      e.on({
        selectionCleared() {
          setIsSelectionCreated(false)
        },
      })
    }

    async function initEditor() {
      const data = await imageResize(
        BLANK_IMAGE_DATAURL,
        IMAGE_WIDTH,
        IMAGE_HEIGHT,
        false
      )
      setBlankImage(data)

      const containerEl = document.querySelectorAll(
        '.tui-image-editor-canvas-container'
      )[idx]

      const containerCanvas = document.querySelectorAll('.lower-canvas')[idx]

      if (containerEl) {
        containerEl.parentElement.style.height = rem(328)
        containerEl.addEventListener('contextmenu', e => {
          console.log('eee', e)
          setContextMenuCursor({x: e.layerX, y: e.layerY})
          setShowContextMenu(true)
          setRightMenuPanel(RightMenu.None)
          if (editors[idx]) {
            editors[idx].stopDrawingMode()
          }
          e.preventDefault()
        })
      }

      if (containerCanvas) {
        containerCanvas.style.borderRadius = rem(8)
      }

      const newEditor =
        editorRefs.current[idx] &&
        editorRefs.current[idx].current &&
        editorRefs.current[idx].current.getInstance()

      if (newEditor) {
        if (!editors[idx]) {
          setEditor(idx, newEditor)
          newEditor.setBrush({width: brush, color: brushColor})

          if (src) {
            newEditor.loadImageFromURL(src, 'src').then(() => {
              newEditor.clearUndoStack()
              newEditor.clearRedoStack()
              updateEvents(newEditor)
            })
          } else {
            newEditor.loadImageFromURL(blankImage, 'blank').then(() => {
              newEditor.clearUndoStack()
              newEditor.clearRedoStack()
              updateEvents(newEditor)
            })
          }
        }
      }
    }

    initEditor()

    return () => {
      mousetrap.reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorRefs, src, idx])

  React.useEffect(() => {
    if (showImageSearch || !visible) {
      editorRefs.current[idx].current.getInstance().discardSelection()
    }
  }, [idx, showImageSearch, visible])

  const leftArrowPortalRef = React.useRef()
  const rightArrowPortalRef = React.useRef()

  return (
    <Box display={visible ? 'initial' : 'none'}>
      <Flex>
        <Box position="relative">
          {(bottomMenuPanel === BottomMenu.Erase ||
            rightMenuPanel === RightMenu.Erase) && (
            <ImageEraseEditor
              url={activeObjectUrl}
              isDone={bottomMenuPanel !== BottomMenu.Erase}
              brushWidth={brush}
              imageObjectProps={getEditorObjectProps(
                editors[idx],
                activeObjectId
              )}
              onChanging={() => {
                if (editors[idx] && activeObjectId) {
                  setChangesCnt(NOCHANGES)
                  editors[idx].setObjectPropertiesQuietly(activeObjectId, {
                    opacity: 0,
                  })
                }
              }}
              onDone={url => {
                if (url) {
                  if (editors[idx] && activeObjectId) {
                    setChangesCnt(NOCHANGES)
                    editors[idx].setObjectPropertiesQuietly(activeObjectId, {
                      opacity: 1,
                    })
                  }

                  setImageUrl(
                    {
                      url,
                      insertMode: INSERT_OBJECT_IMAGE,
                      replaceObjectId: activeObjectId,
                    },
                    () => {
                      setRightMenuPanel(RightMenu.None)
                    }
                  )
                }
              }}
            />
          )}

          <EditorContextMenu
            isOpen={showContextMenu}
            {...contextMenuCursor}
            onCopy={handleOnCopy}
            onPaste={handleOnPaste}
            isDeletable={activeObjectId || isSelectionCreated}
            onDelete={handleOnDelete}
          />

          <Box
            h={rem(IMAGE_HEIGHT)}
            w={rem(IMAGE_WIDTH)}
            border="1px"
            borderColor="brandGray.016"
            rounded="lg"
          >
            <ImageEditor
              key={idx}
              ref={editorRefs.current[idx]}
              cssMaxHeight={IMAGE_HEIGHT}
              cssMaxWidth={IMAGE_WIDTH}
              selectionStyle={{
                cornerSize: 8,
                rotatingPointOffset: 20,
                lineWidth: '1',
                cornerColor: theme.colors.white,
                cornerStrokeColor: theme.colors.blue[500],
                transparentCorners: false,
                borderColor: theme.colors.blue[500],
              }}
              usageStatistics={false}
            />
            {idx === adversarialId && (
              <Flex
                position="absolute"
                top={0}
                w={IMAGE_WIDTH}
                h={IMAGE_HEIGHT}
                px={10}
                direction="column"
                align="center"
                justify="center"
              >
                <LockedImageIcon boxSize={9} color="gray.200" />
                <Text align="center" fontSize="md" color="#DCDEDF" my={5}>
                  {t(
                    'Please keep this image locked. To mislead bots, a nonsense image will be generated at the next step.'
                  )}
                </Text>
                <Button
                  color="#56585A"
                  fontWeight={500}
                  backgroundColor="transparent"
                  border="solid 1px #d2d4d9"
                  _hover={{
                    backgroundColor: 'transparent',
                    _disabled: {
                      backgroundColor: 'transparent',
                      color: '#DCDEDF',
                    },
                  }}
                  _active={{
                    backgroundColor: '#F5F6F7',
                  }}
                  onClick={onOpenModal}
                >
                  {t('Unlock image')}
                </Button>
              </Flex>
            )}
          </Box>

          {bottomMenuPanel === BottomMenu.Main && (
            <Stack isInline align="center" spacing={3} mt={3}>
              <FlipEditorIcon
                tooltip={t('Search on web')}
                icon={<SearchIcon />}
                onClick={() => {
                  if (rightMenuPanel === RightMenu.Erase) {
                    setRightMenuPanel(RightMenu.None)
                  }
                  setInsertImageMode(INSERT_BACKGROUND_IMAGE)
                  setShowImageSearch(true)
                }}
              />

              {showArrowHint && (
                <Portal containerRef={leftArrowPortalRef}>
                  <ArrowHint
                    hint={t('Start from uploading an image')}
                    leftHanded
                  />
                </Portal>
              )}

              <Box ref={leftArrowPortalRef} position="relative">
                <FlipEditorIcon
                  tooltip={t('Select file')}
                  icon={<FolderIcon />}
                  onClick={() => {
                    if (rightMenuPanel === RightMenu.Erase) {
                      setRightMenuPanel(RightMenu.None)
                    }
                    setInsertImageMode(INSERT_BACKGROUND_IMAGE)
                    uploaderRef.current.click()
                  }}
                />
              </Box>

              <VisuallyHidden>
                <input
                  id="file"
                  type="file"
                  accept="image/*"
                  ref={uploaderRef}
                  onChange={handleUpload}
                />
              </VisuallyHidden>

              <Menu autoSelect={false}>
                <Tooltip label={t('Add image')}>
                  <MenuButton
                    as={Box}
                    cursor="pointer"
                    _hover={{color: 'blue.500'}}
                  >
                    <FlipEditorIcon
                      tooltip={t('Add image')}
                      icon={<AddImageIcon />}
                      onClick={() => {
                        if (rightMenuPanel === RightMenu.Erase) {
                          setRightMenuPanel(RightMenu.None)
                        }
                        editors[idx].stopDrawingMode()
                        setRightMenuPanel(RightMenu.None)
                      }}
                    />
                  </MenuButton>
                </Tooltip>
                <FlipEditorMenuList zIndex="popover">
                  <FlipEditorMenuItem
                    onClick={async () => {
                      setInsertImageMode(INSERT_OBJECT_IMAGE)
                      setShowImageSearch(true)
                    }}
                    icon={<SearchIcon boxSize={5} color="blue.500" />}
                  >
                    {t('Search on web')}
                  </FlipEditorMenuItem>
                  <FlipEditorMenuItem
                    onClick={async () => {
                      setInsertImageMode(INSERT_OBJECT_IMAGE)
                      uploaderRef.current.click()
                    }}
                    icon={<FolderIcon boxSize={5} color="blue.500" />}
                  >
                    {t('Select file')}
                  </FlipEditorMenuItem>
                  <FlipEditorMenuItem
                    onClick={async () => {
                      handleImageFromClipboard(INSERT_OBJECT_IMAGE)
                    }}
                    icon={<ClipboardIcon boxSize={5} color="blue.500" />}
                  >
                    {t('Paste image')}
                  </FlipEditorMenuItem>
                </FlipEditorMenuList>
              </Menu>

              <Divider orientation="vertical" h={5} />

              <FlipEditorIcon
                icon={<UndoIcon />}
                tooltip={`${t('Undo')} (${global.isMac ? 'Cmd+Z' : 'Ctrl+Z'})`}
                isDisabled={editors[idx] && editors[idx].isEmptyUndoStack()}
                onClick={handleUndo}
              />
              <FlipEditorIcon
                icon={<RedoIcon />}
                tooltip={`${t('Redo')} (${
                  global.isMac ? 'Cmd+Shift+Z' : 'Ctrl+Shift+Z'
                })`}
                isDisabled={editors[idx] && editors[idx].isEmptyUndoStack()}
                onClick={handleRedo}
              />

              <Divider orientation="vertical" h={5} />

              <FlipEditorIcon
                tooltip={t('Crop image')}
                icon={<CropIcon />}
                isDisabled={src === null}
                onClick={() => {
                  editors[idx].startDrawingMode('CROPPER')
                  if (rightMenuPanel === RightMenu.Erase) {
                    setRightMenuPanel(RightMenu.None)
                  }
                  setBottomMenuPanel(BottomMenu.Crop)
                }}
              />

              {showArrowHint && (
                <Portal containerRef={rightArrowPortalRef}>
                  <ArrowHint hint={t('Or start drawing')} />
                </Portal>
              )}

              <Box ref={rightArrowPortalRef} position="relative">
                <FlipEditorIcon
                  tooltip={t('Draw')}
                  isActive={rightMenuPanel === RightMenu.FreeDrawing}
                  icon={<DrawIcon />}
                  onClick={() => {
                    setShowArrowHint(false)
                    const editor = editors[idx]
                    if (editor.getDrawingMode() === 'FREE_DRAWING') {
                      setRightMenuPanel(RightMenu.None)
                      editor.stopDrawingMode()
                    } else {
                      setRightMenuPanel(RightMenu.FreeDrawing)
                      editor.startDrawingMode('FREE_DRAWING')
                    }
                  }}
                />
              </Box>

              <FlipEditorIcon
                isDisabled={!activeObjectUrl}
                tooltip={
                  activeObjectUrl ? t('Erase') : t('Select image to erase')
                }
                isActive={rightMenuPanel === RightMenu.Erase}
                icon={<EraserIcon />}
                onClick={() => {
                  if (rightMenuPanel === RightMenu.Erase) {
                    setRightMenuPanel(RightMenu.None)
                    setBottomMenuPanel(BottomMenu.Main)
                  } else {
                    setRightMenuPanel(RightMenu.Erase)
                    setBottomMenuPanel(BottomMenu.Erase)
                  }
                }}
              />

              <Divider orientation="vertical" h={5} />

              <FlipEditorIcon
                tooltip={t('Clear')}
                icon={<BasketIcon />}
                color="red.500"
                _hover={{color: 'red.500'}}
                onClick={() => handleOnClear(idx)}
              />
            </Stack>
          )}

          {bottomMenuPanel === BottomMenu.Crop && (
            <ApplyChangesBottomPanel
              label={t('Crop image')}
              onCancel={() => {
                setBottomMenuPanel(BottomMenu.Main)
                setRightMenuPanel(RightMenu.None)
                if (editors[idx]) {
                  editors[idx].stopDrawingMode()
                }
              }}
              onDone={() => {
                setBottomMenuPanel(BottomMenu.Main)
                if (editors[idx]) {
                  const {width, height} = editors[idx].getCropzoneRect()
                  if (width < 1 || height < 1) {
                    editors[idx].stopDrawingMode()
                  } else {
                    editors[idx]
                      .crop(editors[idx].getCropzoneRect())
                      .then(() => {
                        editors[idx].stopDrawingMode()
                        setRightMenuPanel(RightMenu.None)
                        setImageUrl({
                          url: editors[idx].toDataURL(),
                          insertMode: INSERT_BACKGROUND_IMAGE,
                          customEditor: editors[idx],
                        })
                      })
                  }
                }
              }}
            />
          )}

          {bottomMenuPanel === BottomMenu.Erase && (
            <ApplyChangesBottomPanel
              label={t('Erase')}
              onCancel={() => {
                if (editors[idx] && activeObjectId) {
                  setChangesCnt(NOCHANGES)
                  editors[idx].setObjectPropertiesQuietly(activeObjectId, {
                    opacity: 1,
                  })
                }

                setBottomMenuPanel(BottomMenu.Main)
                setRightMenuPanel(RightMenu.None)
              }}
              onDone={() => {
                setBottomMenuPanel(BottomMenu.Main)
              }}
            />
          )}
        </Box>

        {rightMenuPanel === RightMenu.FreeDrawing && (
          <Stack align="center" ml={6}>
            <Box>
              <Menu autoSelect={false} placement="left-start">
                <MenuButton
                  bg={`#${brushColor}`}
                  borderWidth={1}
                  borderColor={colorPickerColor(brushColor)}
                  borderRadius="full"
                  w={4}
                  h={4}
                  outline="none"
                  _hover={{bg: `#${brushColor}`}}
                  _active={{bg: `#${brushColor}`}}
                />
                <FlipEditorMenuList px={2} mt={-1}>
                  <SimpleGrid columns={4} spacing={1}>
                    {[
                      'ffffff',
                      'd2d4d9e0',
                      '96999edd',
                      '53565cdd',
                      'ff6666dd',
                      'ff60e7dd',
                      'a066ffdd',
                      '578fffdd',
                      '0cbdd0dd',
                      '27d980dd',
                      'ffd763dd',
                      'ffa366dd',
                    ].map(color => (
                      <FlipEditorMenuItem
                        justifyContent="center"
                        borderRadius="sm"
                        p={1}
                        onClick={() => {
                          setBrushColor(color)
                          if (!editors[idx]) return
                          const nextColor = `#${color}`
                          editors[idx].setBrush({
                            width: brush,
                            color: nextColor,
                          })
                        }}
                      >
                        <Box
                          bg={`#${color}`}
                          borderWidth={1}
                          borderColor={colorPickerColor(color)}
                          borderRadius="full"
                          boxSize={4}
                          position="relative"
                        >
                          {color === brushColor && (
                            <Box
                              position="absolute"
                              top={-1}
                              left={-1}
                              right={-1}
                              bottom={-1}
                              borderColor={colorPickerColor(color)}
                              borderWidth={1}
                              borderRadius="full"
                            />
                          )}
                        </Box>
                      </FlipEditorMenuItem>
                    ))}
                  </SimpleGrid>
                </FlipEditorMenuList>
              </Menu>
            </Box>

            <Divider orientation="horizontal" w={6} />

            <Brushes
              brush={brush}
              onChange={b => {
                setBrush(b)
                if (!editors[idx]) return
                editors[idx].setBrush({width: b, color: brushColor})
              }}
            />
          </Stack>
        )}
        {rightMenuPanel === RightMenu.Erase && (
          <Box ml={6}>
            <Brushes
              brush={brush}
              onChange={b => {
                setBrush(b)
                if (!editors[idx]) return
                editors[idx].setBrush({width: b, color: brushColor})
              }}
            />
          </Box>
        )}
      </Flex>

      <ImageSearchDialog
        isOpen={showImageSearch}
        onPick={url => {
          if (visible) {
            setImageUrl({url})
          }
          setInsertImageMode(0)
          setShowImageSearch(false)
        }}
        onClose={() => {
          setShowImageSearch(false)
        }}
        onError={error =>
          toast({
            // eslint-disable-next-line react/display-name
            render: () => <Toast title={error} status="error" />,
          })
        }
      />

      <Dialog onClose={onCloseModal} isOpen={isOpenModal} isCentered>
        <DialogHeader fontSize="lg" fontWeight={500}>
          {t('Are you sure?')}
        </DialogHeader>
        <DialogBody>
          <Flex h="100%" w="100%" direction="column" align="center">
            <Text>
              {t(
                'We recommend using 3 images to tell your story so a generated nonsense image could be added to mislead bots.'
              )}
            </Text>
            <Flex w="100%" justify="flex-end"></Flex>
          </Flex>
        </DialogBody>
        <DialogFooter>
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              onChangeAdversarial(-1)
              setBottomMenuPanel(BottomMenu.Main)
              onCloseModal()
            }}
          >
            {t('Yes, unlock image')}
          </Button>
          <Button variant="secondary" onClick={onCloseModal}>
            {t('Cancel')}
          </Button>
        </DialogFooter>
      </Dialog>
    </Box>
  )
}

function Brushes({brush, onChange}) {
  const brushes = [4, 12, 20, 28, 36]
  return (
    <Stack spacing={2} align="center">
      {brushes.map((b, i) => (
        <Flex
          key={b}
          align="center"
          justify="center"
          bg={brush === b ? 'gray.50' : 'none'}
          borderRadius="sm"
          onClick={() => onChange(b)}
          boxSize={6}
        >
          <Box
            bg="brandGray.500"
            borderRadius="full"
            boxSize={rem((i + 1) * 2)}
          />
        </Flex>
      ))}
    </Stack>
  )
}

function ArrowHint({hint, leftHanded}) {
  return (
    <Box position="relative">
      <Box position="absolute" bottom="76px" zIndex={90}>
        {leftHanded && (
          <div>
            <Box
              borderColor="blue.500"
              borderLeftWidth={2}
              borderTopWidth={2}
              minW={6}
              minH={10}
            />
            <Box
              borderWidth={6}
              borderBottom="none"
              borderColor="transparent"
              borderTopColor="blue.500"
              w={0}
              h={0}
              position="absolute"
              left="-5px"
            />
            <Box
              color="muted"
              fontWeight={400}
              minW={75}
              position="absolute"
              left="30px"
              top="-25px"
            >
              {hint}
            </Box>
          </div>
        )}

        {!leftHanded && (
          <Box>
            <Box
              borderColor="blue.500"
              borderRightWidth={2}
              borderTopWidth={2}
              minW={6}
              minH={10}
            />
            <Box
              borderWidth={6}
              borderBottom="none"
              borderColor="transparent"
              borderTopColor="blue.500"
              position="absolute"
              right={-1}
              w={0}
              h={0}
            />
            <Box
              color="muted"
              fontWeight={400}
              w="52px"
              minW="52px"
              position="absolute"
              left="-58px"
              top="-25px"
            >
              {hint}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  )
}

function EditorContextMenu({
  x,
  y,
  isDeletable,
  onCopy,
  onPaste,
  onDelete,
  ...props
}) {
  const {t} = useTranslation()

  return (
    <Menu {...props}>
      <FlipEditorMenuList position="absolute" top={y} left={x} zIndex="popover">
        <FlipEditorMenuItem
          onClick={onCopy}
          icon={<CopyIcon boxSize={5} color="blue.500" />}
        >
          {`${t('Copy')} (${global.isMac ? 'Cmd+C' : 'Ctrl+C'})`}
        </FlipEditorMenuItem>

        <FlipEditorMenuItem
          onClick={onPaste}
          icon={<ClipboardIcon boxSize={5} color="blue.500" />}
        >
          {`${t('Paste image')} (${global.isMac ? 'Cmd+V' : 'Ctrl+V'})`}
        </FlipEditorMenuItem>

        <FlipEditorMenuItem
          isDisabled={!isDeletable}
          onClick={onDelete}
          color="red.500"
          icon={<DeleteIcon boxSize={5} color="red.500" />}
        >
          {t('Delete')}
        </FlipEditorMenuItem>
      </FlipEditorMenuList>
    </Menu>
  )
}

function ImageEraseEditor({
  url,
  brushWidth,
  imageObjectProps,
  onDone,
  onChanging,
  isDone,
}) {
  const canvasRef = useRef()
  const [isMouseDown, setIsMouseDown] = useState(false)

  React.useEffect(() => {
    if (isDone && onDone) {
      if (canvasRef.current) {
        onDone(canvasRef.current.toDataURL())
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDone])

  const handleMouseMove = useCallback(
    e => {
      const ctx = canvasRef.current && canvasRef.current.getContext('2d')

      const x = e.nativeEvent.offsetX
      const y = e.nativeEvent.offsetY
      if (ctx && isMouseDown) {
        onChanging()
        ctx.globalCompositeOperation = 'destination-out'

        ctx.beginPath()
        ctx.arc(x, y, brushWidth / 2, 0, 2 * Math.PI)
        ctx.fill()
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canvasRef, isMouseDown]
  )

  const handleMouseDown = () => {
    setIsMouseDown(true)

    onChanging()
  }

  const handleMouseUp = () => {
    setIsMouseDown(false)
  }

  React.useEffect(() => {
    let ignore = false

    async function init() {
      if (!ignore && canvasRef.current) {
        let img = new Image()
        img.setAttribute('crossOrigin', 'anonymous')
        img.src = url
        img.onload = function() {
          const width =
            img.width * ((imageObjectProps && imageObjectProps.scaleX) || 1)
          const height =
            img.height * ((imageObjectProps && imageObjectProps.scaleY) || 1)
          canvasRef.current.width = width
          canvasRef.current.height = height

          const ctx = canvasRef.current.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)

          img = null
        }
      }
    }
    init()
    return () => {
      ignore = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasRef])

  const left =
    imageObjectProps?.x -
    (imageObjectProps?.width * imageObjectProps?.scaleX) / 2 +
    1

  const top =
    imageObjectProps?.y -
    (imageObjectProps?.height * imageObjectProps?.scaleY) / 2 +
    1

  const angle = imageObjectProps?.angle ?? 0

  return (
    <Box position="relative" display={isDone ? 'none' : 'initial'}>
      <Box
        position="absolute"
        top={0}
        left={0}
        height={IMAGE_HEIGHT - 2}
        width={IMAGE_WIDTH - 2}
        overflow="hidden"
        zIndex={100}
      >
        <Box
          borderRadius="xl"
          w="full"
          h="full"
          cursor="crosshair"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
        >
          <Box
            ref={canvasRef}
            as="canvas"
            bg="transparent"
            position="absolute"
            left={`${left}px`}
            top={`${top}px`}
            transform={`rotate(${angle}deg)`}
            onMouseMove={e => handleMouseMove(e)}
          />
        </Box>
      </Box>
    </Box>
  )
}

function ApplyChangesBottomPanel({label, onDone, onCancel}) {
  const {t} = useTranslation()
  return (
    <Flex justify="space-between" align="center" fontWeight={500} mt={3} px={3}>
      {label}
      <Stack isInline align="center">
        <DrawingToolbarButton onClick={onCancel}>
          {t('Cancel')}
        </DrawingToolbarButton>
        <Divider orientation="vertical" h={5} />
        <DrawingToolbarButton fontWeight={600} onClick={onDone}>
          {t('Done')}
        </DrawingToolbarButton>
      </Stack>
    </Flex>
  )
}

function FlipEditorIcon({tooltip, isActive, isDisabled, mr, ...props}) {
  const icon = (
    <IconButton
      aria-label={tooltip}
      isDisabled={isDisabled}
      bg={isActive ? 'gray.50' : 'unset'}
      color={isActive ? 'brandBlue.500' : 'unset'}
      fontSize={20}
      size={6}
      rounded="md"
      p={1 / 2}
      _hover={{color: isDisabled ? 'inherit' : 'brandBlue.500'}}
      _active={{bg: 'transparent'}}
      {...props}
    />
  )
  return (
    <Box mr={mr}>
      <Tooltip label={tooltip} shouldWrapChildren>
        {icon}
      </Tooltip>
    </Box>
  )
}

function FlipEditorMenuList(props) {
  return (
    <MenuList
      border="none"
      shadow="0 4px 6px 0 rgba(83, 86, 92, 0.24), 0 0 2px 0 rgba(83, 86, 92, 0.2)"
      rounded="lg"
      py={2}
      minW={145}
      {...props}
    />
  )
}

function FlipEditorMenuItem({children, ...props}) {
  return (
    <MenuItem
      color="brandGray.500"
      fontWeight={500}
      px={3}
      py={3 / 2}
      _hover={{bg: 'gray.50'}}
      _focus={{bg: 'gray.50'}}
      _selected={{bg: 'gray.50'}}
      _active={{bg: 'gray.50'}}
      {...props}
    >
      <Stack isInline spacing={2} align="center">
        {React.Children.map(children, child => (
          <Box>{child}</Box>
        ))}
      </Stack>
    </MenuItem>
  )
}

function DrawingToolbarButton(props) {
  return (
    <Button
      variant="link"
      colorScheme="blue"
      fontWeight={500}
      _hover={null}
      _active={null}
      {...props}
    />
  )
}
