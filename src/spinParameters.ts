// copyright (c) Microsoft Corporation. All rights reserved.
// licensed under the MIT License.

export enum SpinCounterInterval {
    /// <summary>
    /// the coarse interval drops the 24 least significant bits in DateTime.Ticks
    /// resulting in a counter that increments every 1.67 seconds.
    /// </summary>
    Coarse,

    /// <summary>
    /// the fine interval drops the 16 least significant bits in DateTime.Ticks
    /// resulting in a counter that increments every 6.5 milliseconds.
    /// </summary>
    Fine
}

export enum SpinCounterPeriodicity {
    /// <summary>
    /// do not store a counter as part of the spin value.
    /// </summary>
    None,

    /// <summary>
    /// the short periodicity stores the counter using 16 bits.
    /// </summary>
    Short,

    /// <summary>
    /// the medium periodicity stores the counter using 24 bits.
    /// </summary>
    Medium,
}

export enum SpinEntropy {
    /// <summary>
    /// do not generate entropy as part of the spin value.
    /// </summary>
    None = 0,

    /// <summary>
    /// generate entropy using 8 bits.
    /// </summary>
    One = 1,

    /// <summary>
    /// generate entropy using 16 bits.
    /// </summary>
    Two = 2,
}

/// <summary>
/// this class stores parameters used by the CorrelationVector Spin operator.
/// </summary>
export class SpinParameters {
    constructor(interval: SpinCounterInterval, periodicity: SpinCounterPeriodicity, entropy: SpinEntropy) {
        this.interval = interval;
        this.periodicity = periodicity;
        this.entropy = entropy;
    }

    /// <summary>
    /// the interval (proportional to time) by which the counter increments.
    /// </summary>
    public interval: SpinCounterInterval;

    /// <summary>
    /// how frequently the counter wraps around to zero, as determined by the amount
    /// of space to store the counter.
    /// </summary>
    public periodicity: SpinCounterPeriodicity;

    /// <summary>
    /// the number of bytes to use for entropy. Valid values from a
    /// minimum of 0 to a maximum of 4.
    /// </summary>
    public entropy: SpinEntropy;

    // the number of total bits used for spin.
    public get totalBits(): number {
        let counterBits: number;
        switch (this.periodicity) {
            case SpinCounterPeriodicity.None:
                counterBits = 0;
                break;
            case SpinCounterPeriodicity.Short:
                counterBits = 16;
                break;
            case SpinCounterPeriodicity.Medium:
                counterBits = 24;
                break;
            default:
                counterBits = 0;
                break;
        }

        return counterBits + this.entropy * 8;

    }
}
