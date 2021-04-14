import {FC, useRef, useEffect} from 'react'

import 'jsoneditor-react/es/editor.min.css';

const { JsonEditor: Editor } = require('jsoneditor-react');

type JSONEditorProps = {
  value: any
}

export const JSONEditor: FC<JSONEditorProps> = ({value}) => {
  const jsonEditorRef = useRef<any>();
  useEffect(() => {
    const editor = jsonEditorRef.current.jsonEditor

    if (editor && value){
      editor.update(value)
    }
  }, [value])

  return (
    <Editor
      ref={jsonEditorRef}
      value={value}
    />
  )
}
