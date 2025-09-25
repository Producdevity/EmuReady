import { describe, expect, it } from 'vitest'
import { CustomFieldType } from '@orm'
import { parseEdenConfigFromIni } from './parser'
import type { CustomFieldImportDefinition } from '../types'

const baseFields: CustomFieldImportDefinition[] = [
  {
    id: 'cpu_backend',
    name: 'cpu_backend',
    label: 'CPU Backend',
    type: CustomFieldType.SELECT,
    isRequired: true,
    options: [
      { value: 'Native code execution (NCE)', label: 'Native code execution (NCE)' },
      { value: 'Dynamic (Slow)', label: 'Dynamic (Slow)' },
      { value: 'Software', label: 'Software' },
    ],
  },
  {
    id: 'cpu_accuracy',
    name: 'cpu_accuracy',
    label: 'CPU Accuracy',
    type: CustomFieldType.SELECT,
    isRequired: true,
    options: [
      { value: 'Auto', label: 'Auto' },
      { value: 'Accurate', label: 'Accurate' },
      { value: 'Unsafe', label: 'Unsafe' },
    ],
  },
  {
    id: 'gpu_backend',
    name: 'gpu_api',
    label: 'GPU Backend',
    type: CustomFieldType.SELECT,
    isRequired: true,
    options: [
      { value: 'Vulkan', label: 'Vulkan' },
      { value: 'OpenGL', label: 'OpenGL' },
    ],
  },
  {
    id: 'use_disk_shader_cache',
    name: 'disk_shader_cache',
    label: 'Disk shader cache',
    type: CustomFieldType.BOOLEAN,
    isRequired: false,
  },
  {
    id: 'resolution_setup',
    name: 'resolution',
    label: 'Resolution Scale',
    type: CustomFieldType.SELECT,
    isRequired: false,
  },
  {
    id: 'docked_mode',
    name: 'docked_mode',
    label: 'Docked Mode',
    type: CustomFieldType.BOOLEAN,
    isRequired: false,
  },
]

describe('parseEdenConfigFromIni', () => {
  it('maps Eden INI values to custom field values', () => {
    const ini = `
[Cpu]
cpu_backend=1
cpu_accuracy=1

[Renderer]
backend=0
use_disk_shader_cache=false
resolution_setup=4
dyna_state=2
use_video_framerate=true

[System]
use_docked_mode=true
`

    const result = parseEdenConfigFromIni(ini, [
      ...baseFields,
      {
        id: 'extended_dynamic_state',
        name: 'extended_dynamic_state',
        label: 'Extended Dynamic State',
        type: CustomFieldType.RANGE,
        isRequired: false,
      },
      {
        id: 'enhanced_frame_pacing',
        name: 'enhanced_frame_pacing',
        label: 'Enhanced Frame Pacing',
        type: CustomFieldType.BOOLEAN,
        isRequired: false,
      },
    ])

    expect(result.values).toEqual(
      expect.arrayContaining([
        { id: 'cpu_backend', value: 'Native code execution (NCE)' },
        { id: 'cpu_accuracy', value: 'Accurate' },
        { id: 'gpu_backend', value: 'OpenGL' },
        { id: 'use_disk_shader_cache', value: false },
        { id: 'resolution_setup', value: 4 },
        { id: 'docked_mode', value: true },
        { id: 'extended_dynamic_state', value: 2 },
        { id: 'enhanced_frame_pacing', value: true },
      ]),
    )
    expect(result.missing).toEqual([])
    expect(result.warnings).toEqual([])
  })

  it('marks unmapped fields as missing and applies defaults when available', () => {
    const ini = `
[Renderer]
backend=1
`

    const fields: CustomFieldImportDefinition[] = [
      ...baseFields,
      {
        id: 'driver_path',
        name: 'dynamic_driver_version',
        label: 'GPU Driver',
        type: CustomFieldType.URL,
        isRequired: false,
      },
      {
        id: 'accuracy_level',
        name: 'accuracy_level',
        label: 'GPU Accuracy',
        type: CustomFieldType.SELECT,
        isRequired: false,
        defaultValue: 'Normal',
        options: [
          { value: 'Normal', label: 'Normal' },
          { value: 'High', label: 'High' },
        ],
      },
    ]

    const result = parseEdenConfigFromIni(ini, fields)

    expect(result.values).toEqual(
      expect.arrayContaining([
        { id: 'gpu_backend', value: 'Vulkan' },
        { id: 'accuracy_level', value: 'Normal' },
      ]),
    )
    expect(result.missing).toEqual([])
  })
})
