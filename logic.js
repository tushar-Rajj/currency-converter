const countryList = {
      AED:"AE",AFN:"AF",XCD:"AG",ALL:"AL",AMD:"AM",ANG:"AN",AOA:"AO",AQD:"AQ",ARS:"AR",
      AUD:"AU",AZN:"AZ",BAM:"BA",BBD:"BB",BDT:"BD",XOF:"BE",BGN:"BG",BHD:"BH",BIF:"BI",
      BMD:"BM",BND:"BN",BOB:"BO",BRL:"BR",BSD:"BS",NOK:"BV",BWP:"BW",BYR:"BY",BZD:"BZ",
      CAD:"CA",CDF:"CD",XAF:"CF",CHF:"CH",CLP:"CL",CNY:"CN",COP:"CO",CRC:"CR",CUP:"CU",
      CVE:"CV",CYP:"CY",CZK:"CZ",DJF:"DJ",DKK:"DK",DOP:"DO",DZD:"DZ",ECS:"EC",EEK:"EE",
      EGP:"EG",ETB:"ET",EUR:"FR",FJD:"FJ",FKP:"FK",GBP:"GB",GEL:"GE",GGP:"GG",GHS:"GH",
      GIP:"GI",GMD:"GM",GNF:"GN",GTQ:"GT",GYD:"GY",HKD:"HK",HNL:"HN",HRK:"HR",HTG:"HT",
      HUF:"HU",IDR:"ID",ILS:"IL",INR:"IN",IQD:"IQ",IRR:"IR",ISK:"IS",JMD:"JM",JOD:"JO",
      JPY:"JP",KES:"KE",KGS:"KG",KHR:"KH",KMF:"KM",KPW:"KP",KRW:"KR",KWD:"KW",KYD:"KY",
      KZT:"KZ",LAK:"LA",LBP:"LB",LKR:"LK",LRD:"LR",LSL:"LS",LTL:"LT",LVL:"LV",LYD:"LY",
      MAD:"MA",MDL:"MD",MGA:"MG",MKD:"MK",MMK:"MM",MNT:"MN",MOP:"MO",MRO:"MR",MTL:"MT",
      MUR:"MU",MVR:"MV",MWK:"MW",MXN:"MX",MYR:"MY",MZN:"MZ",NAD:"NA",XPF:"NC",NGN:"NG",
      NIO:"NI",NPR:"NP",NZD:"NZ",OMR:"OM",PAB:"PA",PEN:"PE",PGK:"PG",PHP:"PH",PKR:"PK",
      PLN:"PL",PYG:"PY",QAR:"QA",RON:"RO",RSD:"RS",RUB:"RU",RWF:"RW",SAR:"SA",SBD:"SB",
      SCR:"SC",SDG:"SD",SEK:"SE",SGD:"SG",SKK:"SK",SLL:"SL",SOS:"SO",SRD:"SR",STD:"ST",
      SVC:"SV",SYP:"SY",SZL:"SZ",THB:"TH",TJS:"TJ",TMT:"TM",TND:"TN",TOP:"TO",TRY:"TR",
      TTD:"TT",TWD:"TW",TZS:"TZ",UAH:"UA",UGX:"UG",USD:"US",UYU:"UY",UZS:"UZ",VEF:"VE",
      VND:"VN",VUV:"VU",YER:"YE",ZAR:"ZA",ZMK:"ZM",ZWD:"ZW"
    };

    // Elements
    const form = document.getElementById("converter");
    const amountInput = document.getElementById("amount");
    const fromSelect = document.getElementById("from");
    const toSelect = document.getElementById("to");
    const flagFrom = document.getElementById("flag-from");
    const flagTo = document.getElementById("flag-to");
    const result = document.getElementById("result");
    const meta = document.getElementById("meta");
    const convertBtn = document.getElementById("convertBtn");
    const swapBtn = document.getElementById("swap");

    // Populate dropdowns
    (function populate() {
      const codes = Object.keys(countryList);
      for (const select of [fromSelect, toSelect]) {
        codes.forEach(code => {
          const opt = document.createElement("option");
          opt.value = opt.textContent = code;
          select.append(opt);
        });
      }
      fromSelect.value = "USD";
      toSelect.value = "INR";
      updateFlag(fromSelect, flagFrom);
      updateFlag(toSelect, flagTo);

      fromSelect.addEventListener("change", () => updateFlag(fromSelect, flagFrom));
      toSelect.addEventListener("change", () => updateFlag(toSelect, flagTo));
    })();

    function updateFlag(selectEl, imgEl) {
      const cc = countryList[selectEl.value] || "US";
      imgEl.src = `https://flagsapi.com/${cc}/flat/64.png`;
      imgEl.alt = `${selectEl.value} flag`;
    }

    function fmtMoney(value, currency) {
      try {
        return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(value);
      } catch {
        // Fallback if Intl doesn't know the currency code
        return `${Number(value).toFixed(2)} ${currency}`;
      }
    }

    function setLoading(isLoading) {
      form.setAttribute("aria-busy", String(isLoading));
      convertBtn.disabled = isLoading;
      convertBtn.classList.toggle("loading", isLoading);
    }

    async function updateExchangeRate() {
      const amount = parseFloat(amountInput.value);
      const from = fromSelect.value;
      const to = toSelect.value;

      if (!isFinite(amount) || amount <= 0) {
        result.textContent = "Please enter a valid amount greater than 0.";
        amountInput.focus();
        return;
      }

      if (from === to) {
        result.innerHTML = `<strong>${fmtMoney(amount, from)}</strong> = <strong>${fmtMoney(amount, to)}</strong>`;
        meta.textContent = "Same currency selected • 1:1";
        return;
      }

      const url = `https://api.frankfurter.app/latest?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

      setLoading(true);
      result.textContent = "Fetching live rate…";
      meta.textContent = "";

      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`API error (${res.status})`);

        const data = await res.json();
        const rate = data?.rates?.[to];

        if (!rate) throw new Error(`Rate unavailable for ${from} → ${to}`);

        const converted = amount * rate;

        result.innerHTML =
          `<strong>${fmtMoney(amount, from)}</strong> = <strong>${fmtMoney(converted, to)}</strong><br>` +
          `<small>1 ${from} = ${fmtMoney(rate, to)}</small>`;

        const asOf = data?.date ? `As of ${data.date}` : "As of latest available";
        meta.textContent = `Source: frankfurter.app • ${asOf}`;
      } catch (err) {
        const offline = !navigator.onLine ? " (offline?)" : "";
        result.textContent = `Error: ${err.message}${offline}`;
        meta.textContent = "Try again or pick different currencies.";
      } finally {
        setLoading(false);
      }
    }

    // Submit handler
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      updateExchangeRate();
    });

    // Swap currencies
    swapBtn.addEventListener("click", () => {
      const currentFrom = fromSelect.value;
      fromSelect.value = toSelect.value;
      toSelect.value = currentFrom;
      updateFlag(fromSelect, flagFrom);
      updateFlag(toSelect, flagTo);
      updateExchangeRate();
    });

    // Initial fetch on load
    window.addEventListener("load", updateExchangeRate);
