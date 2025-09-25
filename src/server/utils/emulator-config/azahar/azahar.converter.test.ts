import { describe, it, expect } from 'vitest'
import {
  convertToAzaharConfig,
  serializeAzaharConfig,
  type AzaharConfigInput,
  type CustomFieldValue,
} from './azahar.converter'
import type { Prisma } from '@orm'

function createField(name: string, value: Prisma.JsonValue): CustomFieldValue {
  return {
    customFieldDefinition: {
      name,
      label: name,
      type: 'TEXT',
      options: null,
    },
    value,
  }
}

describe('Azahar converter', () => {
  const baseInput: AzaharConfigInput = {
    listingId: 'listing-id',
    gameId: 'game-id',
    customFieldValues: [],
  }

  it('maps renderer and layout fields to Azahar config sections', () => {
    const input: AzaharConfigInput = {
      ...baseInput,
      customFieldValues: [
        createField('graphics_api', 'Vulkan'),
        createField('enable_spiri_v_shader_generation', true),
        createField('disable_spir_v_optimizer', false),
        createField('enable_async_shader_complication', true),
        createField('internal_resolution', '3'),
        createField('linear_filtering', true),
        createField('accurate_multiplication', true),
        createField('disk_shader_cache', false),
        createField('texture_filter', 'Anime4K'),
        createField('delay_game_render_thread', 50),
        createField('stereoscopic_3d_mode', 'Anaglyph'),
        createField('cpu_jit', false),
        createField('enable_hardware_shader', false),
        createField('enable_vsync', false),
        createField('delay_start_with_lle_modules', false),
        createField('layout_option', 'Side by Side'),
        createField('swap_screen', true),
        createField('upright_screen', false),
      ],
    }

    const config = convertToAzaharConfig(input)

    expect(config.Renderer?.graphics_api?.value).toBe(2)
    expect(config.Renderer?.spirv_shader_gen?.value).toBe(true)
    expect(config.Renderer?.disable_spirv_optimizer?.value).toBe(false)
    expect(config.Renderer?.async_shader_compilation?.value).toBe(true)
    expect(config.Renderer?.resolution_factor?.value).toBe(3)
    expect(config.Renderer?.filter_mode?.value).toBe(true)
    expect(config.Renderer?.shaders_accurate_mul?.value).toBe(true)
    expect(config.Renderer?.use_disk_shader_cache?.value).toBe(false)
    expect(config.Renderer?.texture_filter?.value).toBe(1)
    expect(config.Renderer?.delay_game_render_thread_us?.value).toBe(5000)
    expect(config.Renderer?.render_3d?.value).toBe(3)
    expect(config.Renderer?.use_hw_shader?.value).toBe(false)
    expect(config.Renderer?.use_vsync_new?.value).toBe(false)

    expect(config.Core?.use_cpu_jit?.value).toBe(false)

    expect(config.Debugging?.delay_start_for_lle_modules?.value).toBe(false)

    expect(config.Layout?.layout_option?.value).toBe(3)
    expect(config.Layout?.swap_screen?.value).toBe(true)
    expect(config.Layout?.upright_screen?.value).toBe(false)
  })

  it('converts resolution strings like "4x" to numeric factors', () => {
    const config = convertToAzaharConfig({
      ...baseInput,
      customFieldValues: [createField('internal_resolution', '4x')],
    })

    expect(config.Renderer?.resolution_factor?.value).toBe(4)
  })

  it('falls back to SideScreen layout when Separate Windows is selected', () => {
    const config = convertToAzaharConfig({
      ...baseInput,
      customFieldValues: [createField('layout_option', 'Separate Windows')],
    })

    expect(config.Layout?.layout_option?.value).toBe(4)
  })

  it('ignores graphics driver values because Azahar does not support them in INI', () => {
    const config = convertToAzaharConfig({
      ...baseInput,
      customFieldValues: [createField('dynamic_driver_version', 'Test Driver')],
    })

    expect(config.Renderer).toBeUndefined()
  })

  it('serializes configuration to INI format', () => {
    const config = convertToAzaharConfig({
      ...baseInput,
      customFieldValues: [
        createField('graphics_api', 'OpenGLES'),
        createField('enable_hardware_shader', true),
        createField('enable_vsync', false),
        createField('layout_option', 'Default'),
      ],
    })

    const serialized = serializeAzaharConfig(config)

    expect(serialized).toContain('[Renderer]')
    expect(serialized).toContain('graphics_api=1')
    expect(serialized).toContain('use_hw_shader=true')
    expect(serialized).toContain('use_vsync_new=false')
    expect(serialized).toContain('[Layout]')
    expect(serialized).toContain('layout_option=0')
  })

  it('supports corrected async shader field name', () => {
    const config = convertToAzaharConfig({
      ...baseInput,
      customFieldValues: [createField('enable_async_shader_compilation', true)],
    })

    expect(config.Renderer?.async_shader_compilation?.value).toBe(true)
  })
})
