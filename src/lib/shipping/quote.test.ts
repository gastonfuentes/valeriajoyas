import { describe, it, expect } from 'vitest'
import { computeBillableWeight } from './quote'

// All weights are in grams. The function must return an integer.
// Contract: raw = itemCount * defaultItemWeightGrams + packagingWeightGrams
//   floored = max(raw, carrierMinimumGrams)          (carrier minimum)
//   if weightGridGrams <= 0 → return floored
//   else → ceil(floored / weightGridGrams) * weightGridGrams

describe('computeBillableWeight', () => {
  it('rounds up to the next grid step (typical 2-item cart)', () => {
    // raw = 2*30 + 100 = 160; floored = max(160, 500) = 500; ceil(500/1000)*1000 = 1000
    expect(
      computeBillableWeight({
        itemCount: 2,
        defaultItemWeightGrams: 30,
        packagingWeightGrams: 100,
        carrierMinimumGrams: 500,
        weightGridGrams: 1000,
      }),
    ).toBe(1000)
  })

  it('empty cart still gets carrier minimum then grid rounding', () => {
    // raw = 0*30 + 100 = 100; floored = max(100, 500) = 500; ceil(500/1000)*1000 = 1000
    expect(
      computeBillableWeight({
        itemCount: 0,
        defaultItemWeightGrams: 30,
        packagingWeightGrams: 100,
        carrierMinimumGrams: 500,
        weightGridGrams: 1000,
      }),
    ).toBe(1000)
  })

  it('heavy cart: raw exceeds minimum, rounds up to next grid step', () => {
    // raw = 40*30 + 100 = 1300; floored = max(1300, 500) = 1300; ceil(1300/1000)*1000 = 2000
    expect(
      computeBillableWeight({
        itemCount: 40,
        defaultItemWeightGrams: 30,
        packagingWeightGrams: 100,
        carrierMinimumGrams: 500,
        weightGridGrams: 1000,
      }),
    ).toBe(2000)
  })

  it('exact grid boundary stays on that multiple (no spurious +1 grid step)', () => {
    // raw = 10*90 + 100 = 1000; floored = max(1000, 500) = 1000; ceil(1000/1000)*1000 = 1000
    expect(
      computeBillableWeight({
        itemCount: 10,
        defaultItemWeightGrams: 90,
        packagingWeightGrams: 100,
        carrierMinimumGrams: 500,
        weightGridGrams: 1000,
      }),
    ).toBe(1000)
  })

  it('negative itemCount clamps to 0 (treated as empty cart)', () => {
    // itemCount clamped to 0; raw = 0*30 + 100 = 100; floored = 500; grid → 1000
    expect(
      computeBillableWeight({
        itemCount: -5,
        defaultItemWeightGrams: 30,
        packagingWeightGrams: 100,
        carrierMinimumGrams: 500,
        weightGridGrams: 1000,
      }),
    ).toBe(1000)
  })

  it('negative defaultItemWeightGrams clamps to 0', () => {
    // defaultItemWeight clamped to 0; raw = 2*0 + 100 = 100; floored = 500; grid → 1000
    expect(
      computeBillableWeight({
        itemCount: 2,
        defaultItemWeightGrams: -50,
        packagingWeightGrams: 100,
        carrierMinimumGrams: 500,
        weightGridGrams: 1000,
      }),
    ).toBe(1000)
  })

  it('negative packagingWeightGrams clamps to 0', () => {
    // packaging clamped to 0; raw = 2*30 + 0 = 60; floored = 500; grid → 1000
    expect(
      computeBillableWeight({
        itemCount: 2,
        defaultItemWeightGrams: 30,
        packagingWeightGrams: -200,
        carrierMinimumGrams: 500,
        weightGridGrams: 1000,
      }),
    ).toBe(1000)
  })

  it('weightGridGrams <= 0 returns the floored value without grid rounding', () => {
    // raw = 2*30 + 100 = 160; floored = max(160, 500) = 500; grid=0 → return 500
    expect(
      computeBillableWeight({
        itemCount: 2,
        defaultItemWeightGrams: 30,
        packagingWeightGrams: 100,
        carrierMinimumGrams: 500,
        weightGridGrams: 0,
      }),
    ).toBe(500)
  })

  it('weightGridGrams < 0 also returns the floored value without grid rounding', () => {
    expect(
      computeBillableWeight({
        itemCount: 2,
        defaultItemWeightGrams: 30,
        packagingWeightGrams: 100,
        carrierMinimumGrams: 500,
        weightGridGrams: -100,
      }),
    ).toBe(500)
  })
})
