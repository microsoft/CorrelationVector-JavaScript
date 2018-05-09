// -----------------------------------------------------------------------
//  <copyright file="CorrelationVector.ts" company="Microsoft">
//      Copyright (c) Microsoft. All rights reserved.
//  </copyright>
//  <summary>
//      This module handles all the correlation vector data.
//  </summary>
// -----------------------------------------------------------------------
correlationVector = (function () {

    var UNINITIALIZED_cV = "";
    var base = UNINITIALIZED_cV;
    var currentElement = 0;
    var eventTag = "cV";
    var header = "MS-CV";
    var base64CharSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    // cv version-dependent constants
    var cV1Constants = {};
    cV1Constants.maxCorrelationVectorLength = 63;
    cV1Constants.baseLength = 16;
    cV1Constants.validationPattern = new RegExp("^[" + base64CharSet + "]{" + cV1Constants.baseLength.toString() + "}(.[0-9]+)+$");
    var cV2Constants = {};
    cV2Constants.maxCorrelationVectorLength = 127;
    cV2Constants.baseLength = 22;
    cV2Constants.validationPattern = new RegExp("^[" + base64CharSet + "]{" + cV2Constants.baseLength.toString() + "}(.[0-9]+)+$");
    var currentCvConstants = cV2Constants;
    var cvVersionAtLatestValidityCheck = 2;


    // Used for Spin Increment of the cV
    var spinConstants = {};
    
    spinConstants.Interval = {};
    spinConstants.Interval.Coarse = 24;
    spinConstants.Interval.Fine = 16;
    
    spinConstants.Periodicity = {};
    spinConstants.Periodicity.None = 0;
    spinConstants.Periodicity.Short = 16;
    spinConstants.Periodicity.Medium = 24;
    //spinConstants.Periodicity.Long = 32;

    spinConstants.Entropy = {};
    spinConstants.Entropy.None = 0;
    spinConstants.Entropy.One = 1;
    spinConstants.Entropy.Two = 2;
    
    // Java Script can only support up to 2 entropy due to limits on int size
    //spinConstants.Entropy.Three = 3;
    //spinConstants.Entropy.Four = 4;


    var spinDefaults = {}
    spinDefaults.Interval = spinConstants.Interval.Coarse;
    spinDefaults.Periodicity = spinConstants.Periodicity.Short;
    spinDefaults.Entropy = spinConstants.Entropy.Two;    



    function isInit() {
        return isValid(storedCv());
    }

    function storedCv() {
        /// <summary> creates the cv element from stored variables </summary>
        /// <returns> cV element in string format </returns>
        return base.concat(".", currentElement.toString());
    }

    function getValue() {
        /// <summary>
        /// Privileged method to serialize the current value of the Correlation Vector.
        /// CV should not be read from meta tag, but this is a breaking change.
        /// </summary>
        /// <returns type="string">Serialized value of the Correlation Vector</returns>
        var value = storedCv();
        if (isValid(value)) {
            return value;
        }
    }

    function baseIncrement()
    {
        /// <summary>
        /// Privileged method used to increment the impression digit of the CV
        /// </summary>
        /// <remarks>
        ///  The Impresison Digit is the digit in a cV that is second from the left.
        ///   AN3XAMPL3CVBA53.1.2    In the example to the left it would be the 1
        /// </remarks>
        /// <returns type="string">Serialized value of the Correlation Vector</returns>
        var cVTemp = storedCv().split(".");
        var size = cVTemp.length;
        if (size > 2)
        {
            // reset base since we will rebuiding it.
            base = "";
            var cV_IgIndex = size - 2;
            var cV_ig = parseInt(cVTemp[cV_IgIndex]) +1;
            for(var i =0; i < cV_IgIndex; i++)
                {
                    base = base.concat(cVTemp[i], ".");
                }

            base = base.concat(cV_ig.toString());
            currentElement = 0;
        }
        else
        {
            // cV doesn't have an impression digit, so we just increment.
            increment();
        }
        return storedCv();
    }

    function spinIncrement(settings)
    {
        if (canSpin())
        {
            extend();
            if (typeof settings === 'undefined') {
                settings = spinDefaults;
            }
        
            var entropy = 0;
            if (settings.Entropy > 0)        {
                var entoryPow = settings.Entropy * 8;
                entropy = Math.round(Math.random() * Math.pow(2,((settings.Entropy * 8) -1)));
            }
        
            var value = 0;
      
            // the Interval of change should be 1.67 seconds for Coarse
            // and 6.6 ms for fine
            // In JavaScript I am going to use 1.67 seconds, but 7 ms since
            // the Javascript clock stops at the millisecond.
            if (settings.Interval == spinConstants.Interval.Coarse)  {
                value = Math.round(Date.now() / 1670);
            }
            else if (settings.Interval == spinConstants.Interval.Fine) {
                value = Math.round(performance.now() / 7);           
            }
        
            value = ((value << settings.Periodicity-1) >>>0);
            currentElement = (value | entropy) >>> 0;
        
            extend();
        }
        return storedCv();
    }


    function canExtend() {
        /// <summary>
        /// Private method to check if the Correlation Vector can be extended
        /// </summary>
        /// <param name="ref" type="reference">Object reference to the Correlation Vector</param>
        /// <returns type="boolean">True if the Correlation Vector can be extended, false otherwise.</returns>
        var currentCv = storedCv();
        if (isValid(currentCv)) {
            return isLeqThanMaxCorrelationVectorLength(currentCv.length + 2);
        }
        return false;
    }

    function canIncrement() {
        /// <summary>
        /// Private method to check if the Correlation Vector can be incremented
        /// </summary>
        /// <returns type="boolean">True if the Correlation Vector can be incremented, false otherwise.</returns>
        if (isValid(storedCv())) {
            return isLeqThanMaxCorrelationVectorLength(base.length + 1 + ((currentElement + 1) + "").length);
        }
        return false;
    }

    function canSpin() {
        /// <summary>
        /// Private method to check if the Correlation Vector can be spinned
        /// </summary>
        /// <returns type="boolean">True if the Correlation Vector can be spinned, false otherwise.</returns>
        var currentCv = storedCv();

        if (isValid(currentCv)) {
            // + 4 for two extentions, + 10 for max lenght of spin
            return isLeqThanMaxCorrelationVectorLength(currentCv.length + 4 + 10);
        }
        return false;
    }

    function setValue(cV) {
        /// <summary>
        /// Privileged method to de-serialize and set the current value of the Correlation Vector 
        /// from a serialized CV string
        /// There is a breaking change in this code - setValue should not return the correlation
        /// vector. True or false is the agreed upon way, but later.
        /// </summary>
        /// <returns type="string">Serialized value of the updated Correlation Vector</returns>

        if (isValid(cV)) {
            var lastIndex = cV.lastIndexOf(".");
            base = cV.substr(0, lastIndex);
            currentElement = parseInt(cV.substr(lastIndex + 1), 10);
        } else {
            console.log("Cannot set invalid correlation vector value");
            return null;
        }

        return storedCv();
    }

    function ServerInit(cVInitValue)
    {
        base = seedCorrelationVector();
        currentElement = 0;
        return storedCv();
    }

    function ClientInit(cVInitValue) {
        /// <summary>
        /// This function should always be called by adopters
        /// </summary>
        /// <param type = "string"> optional cV constructor value </param>
        /// <returns type="string">Serialized Correlation Vector</returns>

        if (cVInitValue)
        {
            // If a value is passed in, we need to add the Impression Digit, and the current Element
            setValue(cVInitValue);
            extend();
            extend();
        }
        else
        {
            base = seedCorrelationVector();
            currentElement = 1;
            extend();    
        }

        return  storedCv();
    }
    

    function seedCorrelationVector() {
        /// <summary>
        /// Seed function to randomly generate a 16 character base64 encoded string for the Correlation Vector's base value
        /// </summary>
        /// <returns type="string">Returns generated base value</returns>

        var result = "";

        for (var i = 0; i < currentCvConstants.baseLength; i++) {
            result += base64CharSet.charAt(Math.floor(Math.random() * base64CharSet.length));
        }

        return result;
    }

    function extend() {
        /// <summary>
        /// Privileged method to extend the current value of the Correlation Vector
        /// </summary>
        /// <returns type="string">Serialized value of the extended Correlation Vector</returns>

        if (canExtend()) {
            base = base.concat(".", currentElement.toString());
            currentElement = 0;
            return storedCv();
        }
    }

    function increment() {
        /// <summary>
        /// Privileged method to increment the current value of the Correlation Vector
        /// </summary>
        /// <returns type="string">Serialized value of the incremented Correlation Vector</returns>

        if (canIncrement()) {
            currentElement = currentElement + 1;
            return storedCv();
        }
    }

    function isValid(cvValue) {
        /// <summary>
        /// Public Correlation Vector method to check for valid serialized Correlation Vector values
        /// </summary>
        /// <param name="cv" type="string">The Correlation Vector string to be validated</param>
        /// <returns type="boolean">True if the input string represents a valid serialized Correlation Vector, false otherwise.</returns>

        if (cvValue) {
            var baseValue = cvValue.split(".")[0];

            if (baseValue) {
                if (baseValue.length === 16) {
                    cvVersionAtLatestValidityCheck = 1;
                    return validateWithCv1(cvValue);
                } else if (baseValue.length === 22) {
                    cvVersionAtLatestValidityCheck = 2;
                    return validateWithCv2(cvValue);
                }
            }
        }
    }

    function validateWithCv1(cV) {
        if (cV1Constants.validationPattern.test(cV) && cV.length <= cV1Constants.maxCorrelationVectorLength) {
            return true;
        }
    }

    function validateWithCv2(cV) {
        if (cV2Constants.validationPattern.test(cV) && cV.length <= cV2Constants.maxCorrelationVectorLength) {
            return true;
        }
    }

    function isLeqThanMaxCorrelationVectorLength(length) {
        if (cvVersionAtLatestValidityCheck === 1) {
            return length <= cV1Constants.maxCorrelationVectorLength;
        } else {
            return length <= cV2Constants.maxCorrelationVectorLength;
        }
    }

    function useCv1() {
        currentCvConstants = cV1Constants;
    }

    function useCv2() {
        currentCvConstants = cV2Constants;
    }

    return {
        header: header,
        tag: eventTag,
        isInit: isInit,
        canExtend: canExtend,
        canIncrement: canIncrement,
        getValue: getValue,
        setValue: setValue,
        ClientSeed: ClientInit,
        ServerSeed: ServerInit,
        extend: extend,
        increment: increment,
        spin: spinIncrement,
        baseIncrement: baseIncrement,
        isValid: isValid,
        useCv1: useCv1,
        useCv2: useCv2
    };
})();