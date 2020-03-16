import { useEffect, useCallback, useRef, useMemo } from 'react'
import useForm from './useForm'
import get from '../util/get'
import valueChangedInState from '../util/valueChangedInState'
import errorWillChangeInState from '../util/errorWillChangeInState'
import normalizeEmpty from '../util/normalizeEmpty'
import validate from '../util/validate'

const DEFAULT_PARSE = v => v || v === 0 ? v : undefined
const DEFAULT_FORMAT = v => v || v === 0 ? v : ''
const DEFAULT_FIELD = {}

const createShouldUpdate = ({ name, validators, fieldStateRef }) => {
  const errorCheck = errorWillChangeInState({ name, validators, fieldStateRef })
  const valueCheck = valueChangedInState(name)
  return state => errorCheck(state) || valueCheck(state)
}

// const computeFieldState = ({ stateRef, name, parseWhenFocused }) => {
//   const { fields, values, cleanValues, meta } = stateRef.current
//   const field = fields[name] || DEFAULT_FIELD
//   const value = normalizeEmpty(get(values, name, undefined))
//   const cleanValue = normalizeEmpty(get(cleanValues, name, undefined))
//   const bypassParseDueToFocus = field.focused && parseWhenFocused === false
//   return { field, meta, value, cleanValue, bypassParseDueToFocus }
// }

const buildFieldActions = args => {
  const {
    name,
    validators,
    parse,
    fieldStateRef
  } = args

  const setValueWithEffect = (val, { touch = false, noRerun = false } = {}) => {
    fieldStateRef.current.requestRerun = undefined
    fieldStateRef.current.noRerun = noRerun

    const { values, field, cleanValue, bypassParseDueToFocus } = fieldStateRef.current

    const value = bypassParseDueToFocus ? val : parse(val, name)
    const error = validate({ value, values, validators })
    console.log(`setValueWithEffect validate(${value}, ${validators}) = ${error}`)
    const valid = !error
    const touched = !!(field.touched || touch)
    const visited = touched || field.visited || false
    const dirty = cleanValue !== value
    const focused = field.focused
    const newField = { error, valid, touched, visited, dirty, focused, custom: fieldStateRef.current.custom, registered: true }

    console.log('setValueWithEffect', name, { val, value, error, newField })

    fieldStateRef.current.prevValue = value
    fieldStateRef.current.field = newField

    fieldStateRef.current.setValueWithField(name, value, newField)
  }

  const setFocused = focused => {
    const { field } = fieldStateRef.current
    fieldStateRef.current.setField(name, { ...field, focused: true })
  }

  const setVisited = () => {
    const { field, setField } = fieldStateRef.current
    setField(name, { ...field, visited: true })
  }

  const onChange = event => {
    setValueWithEffect(event.target.value, { touch: true })
  }

  const onBlur = () => {
    const { bypassParseDueToFocus, value, field, setValue, setField } = fieldStateRef.current
    if (bypassParseDueToFocus) setValue(name, parse(value))
    setField(name, { ...field, visited: true, focused: false })
  }

  const onFocus = () => setFocused(true)

  return { setValueWithEffect, setFocused, setVisited, onChange, onBlur, onFocus }
}

const useFormSetup = ({ name, validators, fieldStateRef }) => {
  return useMemo(() => {
    const shouldUpdate = createShouldUpdate({ name, validators, fieldStateRef })
    return { shouldUpdate, name }
  })
}

const useFieldSetup = ({ name, validators }) => {
  const fieldStateRef = useRef({})
  const formSetup = useFormSetup({ name, validators, fieldStateRef })
  const form = useForm(formSetup)
  useEffect(() => () => form.removeField(name), [name])
  if (!fieldStateRef.current.setValue) {
    fieldStateRef.current = {
      ...fieldStateRef.current,
      ...form
    }
    fieldStateRef.current.count = 0
    console.log('initialize field', fieldStateRef.current)
  }
  return fieldStateRef
}

const updateFieldState = ({ name, fieldStateRef, parseWhenFocused }) => {
  const { fields, values, cleanValues } = fieldStateRef.current.stateRef.current

  const field = fields[name] || DEFAULT_FIELD
  const value = normalizeEmpty(get(values, name, undefined))
  const cleanValue = normalizeEmpty(get(cleanValues, name, undefined))
  const bypassParseDueToFocus = field.focused && parseWhenFocused === false

  fieldStateRef.current.field = field
  fieldStateRef.current.value = value
  fieldStateRef.current.cleanValue = cleanValue
  fieldStateRef.current.bypassParseDueToFocus = bypassParseDueToFocus

  console.log('updateFieldState', name, fieldStateRef.current)
}

export default ({ name, validators = [], parse = DEFAULT_PARSE, format = DEFAULT_FORMAT, parseWhenFocused = true, custom }) => {
  const fieldStateRef = useFieldSetup({ name, validators })

  // const prevValueRef = useRef()
  updateFieldState({ name, fieldStateRef, parseWhenFocused })

  console.log('---------------------------- useField Rendering', name, { requestRerun: fieldStateRef.current.requestRerun, value: fieldStateRef.current.value })
  // const { setValueWithField, setField, setValue, stateRef, rerunFieldValidationRef } = useFieldSetup({ name, validators })
  // fieldStateRef.current = computeFieldState({ stateRef, name, parseWhenFocused })

  // eturn { field, meta, value, cleanValue, bypassParseDueToFocus }
  // const { field, meta, value, cleanValue } = fieldStateRef.current

  // setValueWithField, setValue, setField, stateRef, rerunFieldValidationRef, custom, parse, prevValueRef, bypassParseDueToFocus
  const actions = useMemo(() => buildFieldActions({ name, validators, parse, fieldStateRef }), [])

  useEffect(() => {
    const { prevValue, requestRerun, value, field } = fieldStateRef.current
    if (value !== prevValue || (requestRerun && value) || !field.registered) {
      if (fieldStateRef.current.count < 50) {
        fieldStateRef.current.count += 1
        fieldStateRef.current.requestRerun = undefined
        actions.setValueWithEffect(value, { noRerun: true })
      } else {
        console.log('EXIT EXIT EXIT')
      }
    }
  })

  return {
    setValue: actions.setValueWithEffect,
    setVisited: actions.setVisited,
    setFocused: actions.setFocused,
    onChange: actions.onChange,
    onBlur: actions.onBlur,
    onFocus: actions.onFocus,

    value: format(fieldStateRef.current.value),
    ...fieldStateRef.current.field,
    submitted: fieldStateRef.current.meta.submitted,
    cleanValue: fieldStateRef.current.cleanValue
  }
}
