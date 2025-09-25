import { describe, expect, it } from 'vitest'
import { CustomFieldType } from '@orm'
import { parseAzaharConfigFromIni } from './parser'
import type { CustomFieldImportDefinition } from '../types'

const baseFields: CustomFieldImportDefinition[] = [
  {
    id: 'graphics_api',
    name: 'graphics_api',
    label: 'Graphics API',
    type: CustomFieldType.SELECT,
    isRequired: true,
    options: [
      { value: 'OpenGLES', label: 'OpenGLES' },
      { value: 'Software', label: 'Software' },
      { value: 'Vulkan', label: 'Vulkan' },
    ],
  },
  {
    id: 'internal_resolution',
    name: 'internal_resolution',
    label: 'Internal Resolution',
    type: CustomFieldType.SELECT,
    isRequired: true,
    options: [
      { value: 'native', label: 'native' },
      { value: '2', label: '2x' },
      { value: '3', label: '3x' },
    ],
  },
  {
    id: 'texture_filter',
    name: 'texture_filter',
    label: 'Texture Filter',
    type: CustomFieldType.SELECT,
    isRequired: true,
    options: [
      { value: 'None', label: 'None' },
      { value: 'ScaleForce', label: 'ScaleForce' },
    ],
  },
  {
    id: 'texture_sampling',
    name: 'texture_sampling',
    label: 'Texture Sampling',
    type: CustomFieldType.SELECT,
    isRequired: true,
    options: [
      { value: 'Game Controlled', label: 'Game Controlled' },
      { value: 'Linear', label: 'Linear' },
    ],
  },
  {
    id: 'delay_game_render_thread',
    name: 'delay_game_render_thread',
    label: 'Delay Game Render Thread',
    type: CustomFieldType.RANGE,
    isRequired: false,
  },
  {
    id: 'stereoscopic_3d_mode',
    name: 'stereoscopic_3d_mode',
    label: 'Stereoscopic Mode',
    type: CustomFieldType.SELECT,
    isRequired: true,
    options: [
      { value: 'Off', label: 'Off' },
      { value: 'Anaglyph', label: 'Anaglyph' },
    ],
  },
  {
    id: 'cpu_jit',
    name: 'cpu_jit',
    label: 'CPU JIT',
    type: CustomFieldType.BOOLEAN,
    isRequired: true,
  },
  {
    id: 'enable_hardware_shader',
    name: 'enable_hardware_shader',
    label: 'Enable Hardware Shader',
    type: CustomFieldType.BOOLEAN,
    isRequired: true,
  },
  {
    id: 'enable_vsync',
    name: 'enable_vsync',
    label: 'Enable VSync',
    type: CustomFieldType.BOOLEAN,
    isRequired: true,
  },
  {
    id: 'delay_start_with_lle_modules',
    name: 'delay_start_with_lle_modules',
    label: 'Delay Start With LLE Modules',
    type: CustomFieldType.BOOLEAN,
    isRequired: true,
  },
  {
    id: 'layout_option',
    name: 'layout_option',
    label: 'Layout Option',
    type: CustomFieldType.SELECT,
    isRequired: true,
    options: [
      { value: 'Default', label: 'Default' },
      { value: 'Side by Side', label: 'Side by Side' },
    ],
  },
  {
    id: 'swap_screen',
    name: 'swap_screen',
    label: 'Swap Screen',
    type: CustomFieldType.BOOLEAN,
    isRequired: true,
  },
  {
    id: 'upright_screen',
    name: 'upright_screen',
    label: 'Upright Screen',
    type: CustomFieldType.BOOLEAN,
    isRequired: true,
  },
]

describe('parseAzaharConfigFromIni', () => {
  it('maps Azahar INI values to custom field values', () => {
    const ini = `
[Renderer]
graphics_api=2
spirv_shader_gen=true
disable_spirv_optimizer=false
async_shader_compilation=true
resolution_factor=4
filter_mode=false
shaders_accurate_mul=true
use_disk_shader_cache=false
texture_filter=3
texture_sampling=2
delay_game_render_thread_us=500
render_3d=3
use_hw_shader=true
use_vsync_new=false

[Core]
use_cpu_jit=false

[Debugging]
delay_start_for_lle_modules=true

[Layout]
layout_option=3
swap_screen=true
upright_screen=false
`

    const result = parseAzaharConfigFromIni(ini, baseFields)

    expect(result.missing).toEqual([])
    expect(result.warnings).toEqual([])
    expect(result.values).toEqual(
      expect.arrayContaining([
        { id: 'graphics_api', value: 'Vulkan' },
        { id: 'internal_resolution', value: '4' },
        { id: 'texture_filter', value: 'ScaleForce' },
        { id: 'texture_sampling', value: 'Linear' },
        { id: 'delay_game_render_thread', value: 5 },
        { id: 'stereoscopic_3d_mode', value: 'Anaglyph' },
        { id: 'cpu_jit', value: false },
        { id: 'enable_hardware_shader', value: true },
        { id: 'enable_vsync', value: false },
        { id: 'delay_start_with_lle_modules', value: true },
        { id: 'layout_option', value: 'Side by Side' },
        { id: 'swap_screen', value: true },
        { id: 'upright_screen', value: false },
      ]),
    )
  })

  it('falls back to defaults for missing values', () => {
    const ini = `
[Renderer]
`

    const result = parseAzaharConfigFromIni(ini, baseFields)

    expect(result.missing).toEqual([])
    expect(result.values).toEqual(
      expect.arrayContaining([
        { id: 'graphics_api', value: 'Vulkan' },
        { id: 'internal_resolution', value: 'native' },
        { id: 'texture_filter', value: 'None' },
        { id: 'texture_sampling', value: 'Game Controlled' },
        { id: 'delay_game_render_thread', value: 0 },
        { id: 'stereoscopic_3d_mode', value: 'Off' },
        { id: 'cpu_jit', value: true },
        { id: 'enable_hardware_shader', value: true },
        { id: 'enable_vsync', value: true },
        { id: 'delay_start_with_lle_modules', value: true },
        { id: 'layout_option', value: 'Default' },
        { id: 'swap_screen', value: false },
        { id: 'upright_screen', value: false },
      ]),
    )
  })

  it('supports corrected async shader field name in upload parsing', () => {
    const fields: CustomFieldImportDefinition[] = [
      {
        id: 'enable_async_shader_compilation',
        name: 'enable_async_shader_compilation',
        label: 'Enable Async Shader Compilation',
        type: CustomFieldType.BOOLEAN,
        isRequired: false,
      },
    ]

    const ini = `
[Renderer]
async_shader_compilation=true
`

    const result = parseAzaharConfigFromIni(ini, fields)
    expect(result.missing).toEqual([])
    expect(result.values).toEqual(
      expect.arrayContaining([{ id: 'enable_async_shader_compilation', value: true }]),
    )
  })
})
