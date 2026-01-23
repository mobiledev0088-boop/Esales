interface ProductInfoItem {
  id?: string | number;
  PD_sales_model_name?: string;
  PD_storage_installed?: string;
  PD_processor?: string;
  PD_memory_installed?: string; // RAM
  PD_operating_system?: string;
  PD_form_factor?: string;
  PD_Made_In_India?: string; // 'Y' | 'N'
  [k: string]: any;
}

export default function generateHtml(data: ProductInfoItem): string {
  const parsePrice = (value: any): number | undefined => {
    if (value === null || value === undefined) return undefined;
    const num = typeof value === 'string' ? Number(value) : Number(value);
    if (!isFinite(num) || num <= 0) return undefined;
    return num;
  };

  const SRP = parsePrice((data as any)?.SRP);
  const Supported_SRP = parsePrice((data as any)?.Supported_SRP);
  const hasSupportedDiscount = SRP && Supported_SRP && Supported_SRP < SRP;
  const price = hasSupportedDiscount ? Supported_SRP : SRP;
  const hasPrice = !!price;
  const percentageDiscount =
    hasSupportedDiscount && SRP && Supported_SRP
      ? Math.round(((SRP - Supported_SRP) / SRP) * 100)
      : 0;

  const hasCoreSpecs =
    data.PD_processor ||
    data.PD_memory_installed ||
    data.PD_storage_installed ||
    data.PD_operating_system ||
    (data as any).PD_chipset;

  const hasGraphicsDisplay =
    (data as any).PD_graphic ||
    (data as any).PD_display ||
    (data as any).PD_vga ||
    (data as any).PD_vram ||
    (data as any).PD_graphic_wattage ||
    (data as any).PD_Refresh_Rate ||
    (data as any).PD_Display_Touch;

  const hasConnectivity =
    (data as any).PD_wireless_connectivity ||
    (data as any).PD_interface ||
    (data as any).PD_expansion_slot;

  const hasInputMultimedia =
    (data as any).PD_input_device ||
    (data as any).PD_camera ||
    (data as any).PD_audio ||
    (data as any).PD_screenpad;

  const hasBatteryPower = (data as any).PD_battery || (data as any).PD_power;

  const hasSupportedAdapters =
    (data as any).Supported_Adapter_1 ||
    (data as any).Supported_Adapter_2 ||
    (data as any).Supported_Adapter_3;

  const supportedAdaptersText = [
    (data as any).Supported_Adapter_1,
    (data as any).Supported_Adapter_2,
    (data as any).Supported_Adapter_3,
  ]
    .filter(Boolean)
    .join(', ');

  const hasPhysical =
    (data as any).PD_weight_and_dimension || (data as any).PD_color;

  const hasSoftwareServices =
    (data as any).PD_office ||
    (data as any).PD_antivirus ||
    (data as any).PD_xbox_game_pass;

  const hasBoxContents =
    (data as any).PD_included_in_the_box || (data as any).PD_optional_accessory;

  const hasAdditionalInfo =
    (data as any).PD_certificate ||
    (data as any).PD_military_grade ||
    (data as any).PD_asus_exclusive_technology;

  return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${data.PD_sales_model_name || 'Product Description'}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
      <link
        href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
      />
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
      />
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background: #f3f4f6;
          color: #111827;
          padding: 24px;
        }
        .page {
          max-width: 960px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
          padding: 28px 26px 32px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          gap: 24px;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 18px;
          margin-bottom: 20px;
        }
        .title-block {
          flex: 1 1 auto;
        }
        .product-title {
          font-size: 24px;
          line-height: 1.3;
          font-weight: 700;
          color: #111827;
          margin-bottom: 8px;
        }
        .subtitle {
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 2px;
        }
        .badge-row {
          margin-top: 8px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .badge-made-in-india {
          background: #dcfce7;
          color: #166534;
          border: 1px solid #bbf7d0;
        }
        .price-block {
          flex: 0 0 auto;
          min-width: 190px;
          text-align: right;
        }
        .price-card {
          display: inline-block;
          padding: 10px 14px;
          border-radius: 999px;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          color: #047857;
        }
        .price-main {
          font-size: 18px;
          font-weight: 700;
        }
        .price-original {
          font-size: 13px;
          color: #6b7280;
          text-decoration: line-through;
          margin-right: 6px;
        }
        .price-tag {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          margin-left: 8px;
          border-radius: 999px;
          background: #10b981;
          color: #ffffff;
          font-size: 11px;
          font-weight: 700;
        }
        .section {
          border-radius: 14px;
          border: 1px solid #e5e7eb;
          padding: 16px 18px 14px;
        //   margin-bottom: 12px;
        margin-vertical: 12px;
          background: #ffffff;
        }
        .section-header {
          display: flex;
          align-items: center;
          margin-bottom: 10px;
        }
        .section-icon {
          width: 28px;
          height: 28px;
          border-radius: 10px;
          background: #eff6ff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          color: #1d4ed8;
          margin-right: 10px;
        }
        .section-title {
          font-size: 15px;
          font-weight: 700;
          color: #111827;
        }
        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          column-gap: 24px;
          row-gap: 12px;
        }
        .info-row {
          margin-bottom: 2px;
        }
        .info-label {
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 3px;
        }
        .info-value {
          font-size: 13px;
          line-height: 1.6;
          color: #111827;
        }
        .info-value strong {
          font-weight: 600;
        }
        .warranty-card {
          display: flex;
          align-items: center;
          padding: 12px 14px;
          border-radius: 12px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
        }
        .warranty-main {
          font-size: 16px;
          font-weight: 700;
          color: #111827;
        }
        .warranty-sub {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 2px;
        }
        .warranty-icon {
          width: 32px;
          height: 32px;
          border-radius: 999px;
          background: #2563eb;
          color: #ffffff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          margin-right: 10px;
        }
        .disclaimer-box {
          margin-top: 12px;
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid #93c5fd;
          background: #eff6ff;
        }
        .disclaimer-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #1d4ed8;
          margin-bottom: 4px;
        }
        .disclaimer-text {
          font-size: 12px;
          color: #1f2937;
          line-height: 1.6;
        }
        .page-break{
          page-break-after: always;
        }
        .avoid-break {
            page-break-inside: avoid;
            break-inside: avoid;
        }
        .mt-4{
          margin-top: 16px;
        }
        @media (max-width: 768px) {
          body {
            padding: 16px;
          }
          .page {
            padding: 18px 16px 22px;
            border-radius: 12px;
          }
          .header {
            flex-direction: column;
            align-items: flex-start;
          }
          .price-block {
            text-align: left;
          }
          .info-grid {
            grid-template-columns: minmax(0, 1fr);
          }
        }
      </style>
    </head>
    <body>
      <div class="page">
        <header class="header">
          <div class="title-block">
            <h1 class="product-title">${data.PD_sales_model_name || 'Product Name'}</h1>
            <p class="subtitle">Part Number: ${data.PD_part_number || 'N/A'}</p>
            <p class="subtitle">Product Line: ${data.PD_product_line_id || 'N/A'}</p>
            <div class="badge-row">
              ${
                data.PD_Made_In_India === 'Y'
                  ? '<span class="badge badge-made-in-india">Made in India</span>'
                  : ''
              }
            </div>
          </div>
          ${
            hasPrice
              ? `<div class="price-block">
                <div class="price-card">
                  ${
                    hasSupportedDiscount && SRP
                      ? `<span class="price-original">${SRP.toLocaleString(
                          'en-IN',
                          {
                            style: 'currency',
                            currency: 'INR',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          },
                        )}</span>`
                      : ''
                  }
                  <span class="price-main">${price!.toLocaleString('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}</span>
                  ${
                    hasSupportedDiscount && SRP
                      ? `<span class="price-tag">${percentageDiscount}% OFF</span>`
                      : ''
                  }
                </div>
              </div>`
              : ''
          }
        </header>

        ${
          hasCoreSpecs
            ? `<section class="section avoid-break">
              <div class="section-header">
                <div class="section-icon"><i class="fa-solid fa-gears"></i></div>
                <h2 class="section-title">Core Specifications</h2>
              </div>
              <div class="info-grid">
                ${
                  data.PD_processor
                    ? `<div class="info-row">
                      <div class="info-label">Processor</div>
                      <div class="info-value">${data.PD_processor}</div>
                    </div>`
                    : ''
                }
                ${
                  data.PD_memory_installed
                    ? `<div class="info-row">
                      <div class="info-label">Memory (RAM)</div>
                      <div class="info-value">${data.PD_memory_installed}</div>
                    </div>`
                    : ''
                }
                ${
                  data.PD_storage_installed
                    ? `<div class="info-row">
                      <div class="info-label">Storage</div>
                      <div class="info-value">${data.PD_storage_installed}</div>
                    </div>`
                    : ''
                }
                ${
                  data.PD_operating_system
                    ? `<div class="info-row">
                      <div class="info-label">Operating System</div>
                      <div class="info-value">${data.PD_operating_system}</div>
                    </div>`
                    : ''
                }
                ${
                  (data as any).PD_chipset
                    ? `<div class="info-row">
                      <div class="info-label">Chipset</div>
                      <div class="info-value">${(data as any).PD_chipset}</div>
                    </div>`
                    : ''
                }
              </div>
            </section>`
            : ''
        }

        ${
          hasGraphicsDisplay
            ? `<section class="section avoid-break">
              <div class="section-header">
                <div class="section-icon"><i class="fa-solid fa-display"></i></div>
                <h2 class="section-title">Graphics & Display</h2>
              </div>
              <div class="info-grid">
                ${
                  (data as any).PD_display
                    ? `<div class="info-row">
                      <div class="info-label">Display</div>
                      <div class="info-value">${(data as any).PD_display}</div>
                    </div>`
                    : ''
                }
                ${
                  (data as any).PD_graphic
                    ? `<div class="info-row">
                      <div class="info-label">Graphics Card</div>
                      <div class="info-value">${(data as any).PD_graphic}</div>
                    </div>`
                    : ''
                }
                ${
                  (data as any).PD_vga
                    ? `<div class="info-row">
                      <div class="info-label">VGA</div>
                      <div class="info-value">${(data as any).PD_vga}</div>
                    </div>`
                    : ''
                }
                ${
                  (data as any).PD_vram
                    ? `<div class="info-row">
                      <div class="info-label">VRAM</div>
                      <div class="info-value">${(data as any).PD_vram}</div>
                    </div>`
                    : ''
                }
                ${
                  (data as any).PD_graphic_wattage
                    ? `<div class="info-row">
                      <div class="info-label">Graphics Wattage</div>
                      <div class="info-value">${(data as any).PD_graphic_wattage}</div>
                    </div>`
                    : ''
                }
                ${
                  (data as any).PD_Refresh_Rate
                    ? `<div class="info-row">
                      <div class="info-label">Refresh Rate</div>
                      <div class="info-value">${(data as any).PD_Refresh_Rate}</div>
                    </div>`
                    : ''
                }
                ${
                  (data as any).PD_Display_Touch
                    ? `<div class="info-row">
                      <div class="info-label">Touch Display</div>
                      <div class="info-value">${(data as any).PD_Display_Touch}</div>
                    </div>`
                    : ''
                }
              </div>
              ${
                (data as any).Disclaimer
                  ? `<div class="disclaimer-box">
                      <div class="disclaimer-title">Disclaimer</div>
                      <div class="disclaimer-text">
                        The SKU features Intel Graphics out-of-the-box. Intel® Arc™ Graphics is only available in models with Intel® Core™ Ultra 5/7/9 processors (with up to 7 Xe cores), dual-channel memory and at least 16GB of system memory.
                      </div>
                    </div>`
                  : ''
              }
            </section>`
            : ''
        }

        ${
          hasConnectivity
            ? `<section class="section avoid-break">
              <div class="section-header">
                <div class="section-icon"><i class="fa-solid fa-wifi"></i></div>
                <h2 class="section-title">Connectivity</h2>
              </div>
              <div class="info-grid">
                ${
                  (data as any).PD_wireless_connectivity
                    ? `<div class="info-row">
                      <div class="info-label">Wireless</div>
                      <div class="info-value">${(data as any).PD_wireless_connectivity}</div>
                    </div>`
                    : ''
                }
                ${
                  (data as any).PD_interface
                    ? `<div class="info-row">
                      <div class="info-label">Ports & Interfaces</div>
                      <div class="info-value">${(data as any).PD_interface}</div>
                    </div>`
                    : ''
                }
                ${
                  (data as any).PD_expansion_slot
                    ? `<div class="info-row">
                      <div class="info-label">Expansion Slots</div>
                      <div class="info-value">${(data as any).PD_expansion_slot}</div>
                    </div>`
                    : ''
                }
              </div>
            </section>`
            : ''
        }

        ${
          hasInputMultimedia
            ? `<section class="section avoid-break">
              <div class="section-header">
                <div class="section-icon"><i class="fa-solid fa-sliders"></i></div>
                <h2 class="section-title">Input & Multimedia</h2>
              </div>
              <div class="info-grid">
                ${
                  (data as any).PD_input_device
                    ? `<div class="info-row">
                      <div class="info-label">Input Devices</div>
                      <div class="info-value">${(data as any).PD_input_device}</div>
                    </div>`
                    : ''
                }
                ${
                  (data as any).PD_camera
                    ? `<div class="info-row">
                      <div class="info-label">Camera</div>
                      <div class="info-value">${(data as any).PD_camera}</div>
                    </div>`
                    : ''
                }
                ${
                  (data as any).PD_audio
                    ? `<div class="info-row">
                      <div class="info-label">Audio System</div>
                      <div class="info-value">${(data as any).PD_audio}</div>
                    </div>`
                    : ''
                }
                ${
                  (data as any).PD_screenpad
                    ? `<div class="info-row">
                      <div class="info-label">ScreenPad</div>
                      <div class="info-value">${(data as any).PD_screenpad}</div>
                    </div>`
                    : ''
                }
              </div>
            </section>`
            : ''
        }

        ${
          hasBatteryPower
            ? `<section class="section avoid-break">
              <div class="section-header">
                <div class="section-icon"><i class="fa-solid fa-battery-half"></i></div>
                <h2 class="section-title">Battery & Power</h2>
              </div>
              <div class="info-grid">
                ${
                  (data as any).PD_battery
                    ? `<div class="info-row">
                      <div class="info-label">Battery</div>
                      <div class="info-value">${(data as any).PD_battery}</div>
                    </div>`
                    : ''
                }
                ${
                  (data as any).PD_power
                    ? `<div class="info-row">
                      <div class="info-label">Power Adapter</div>
                      <div class="info-value">${(data as any).PD_power}</div>
                    </div>`
                    : ''
                }
                ${
                  hasSupportedAdapters && supportedAdaptersText
                    ? `<div class="info-row">
                      <div class="info-label">Supported Adapters</div>
                      <div class="info-value">${supportedAdaptersText}</div>
                    </div>`
                    : ''
                }
              </div>
            </section>`
            : ''
        }

        ${
          hasPhysical
            ? `<section class="section avoid-break">
              <div class="section-header">
                <div class="section-icon"><i class="fa-solid fa-ruler-combined"></i></div>
                <h2 class="section-title">Physical Specifications</h2>
              </div>
              <div class="info-grid">
                ${
                  (data as any).PD_color
                    ? `<div class="info-row">
                      <div class="info-label">Color</div>
                      <div class="info-value">${(data as any).PD_color}</div>
                    </div>`
                    : ''
                }
                ${
                  (data as any).PD_weight_and_dimension
                    ? `<div class="info-row">
                      <div class="info-label">Weight & Dimensions</div>
                      <div class="info-value">${(data as any).PD_weight_and_dimension}</div>
                    </div>`
                    : ''
                }
              </div>
            </section>`
            : ''
        }

        ${
          (data as any).PD_security
            ? `<section class="section avoid-break">
              <div class="section-header">
                <div class="section-icon"><i class="fa-solid fa-shield-halved"></i></div>
                <h2 class="section-title">Security Features</h2>
              </div>
              <div class="info-grid">
                <div class="info-row">
                  <div class="info-label">Security</div>
                  <div class="info-value">${(data as any).PD_security}</div>
                </div>
              </div>
            </section>`
            : ''
        }

        ${
          hasBoxContents
            ? `<section class="section avoid-break">
              <div class="section-header">
                <div class="section-icon"><i class="fa-solid fa-box-open"></i></div>
                <h2 class="section-title">Box Contents & Accessories</h2>
              </div>
              <div class="info-grid">
                ${
                  (data as any).PD_included_in_the_box
                    ? `<div class="info-row">
                      <div class="info-label">Included Items</div>
                      <div class="info-value">${(data as any).PD_included_in_the_box}</div>
                    </div>`
                    : ''
                }
                ${
                  (data as any).PD_optional_accessory
                    ? `<div class="info-row">
                      <div class="info-label">Optional Accessories</div>
                      <div class="info-value">${(data as any).PD_optional_accessory}</div>
                    </div>`
                    : ''
                }
              </div>
            </section>`
            : ''
        }

        ${
          hasSoftwareServices
            ? `<section class="section avoid-break">
              <div class="section-header">
                <div class="section-icon"><i class="fa-solid fa-laptop-code"></i></div>
                <h2 class="section-title">Software & Services</h2>
              </div>
              <div class="info-grid">
                ${
                  (data as any).PD_office && (data as any).PD_office !== 'N/A'
                    ? `<div class="info-row">
                      <div class="info-label">Office Suite</div>
                      <div class="info-value">${(data as any).PD_office}</div>
                    </div>`
                    : ''
                }
                ${
                  (data as any).PD_antivirus &&
                  (data as any).PD_antivirus !== 'N/A'
                    ? `<div class="info-row">
                      <div class="info-label">Antivirus</div>
                      <div class="info-value">${(data as any).PD_antivirus}</div>
                    </div>`
                    : ''
                }
                ${
                  (data as any).PD_xbox_game_pass
                    ? `<div class="info-row">
                      <div class="info-label">Xbox Game Pass</div>
                      <div class="info-value">${(data as any).PD_xbox_game_pass}</div>
                    </div>`
                    : ''
                }
              </div>
            </section>`
            : ''
        }

        ${
          (data as any).PD_warranty
            ? `<section class="section avoid-break">
              <div class="section-header">
                <div class="section-icon"><i class="fa-solid fa-medal"></i></div>
                <h2 class="section-title">Warranty & Support</h2>
              </div>
              <div class="warranty-card">
                <div class="warranty-icon"><i class="fa-solid fa-check"></i></div>
                <div>
                  <div class="warranty-sub">Warranty Period</div>
                  <div class="warranty-main">${(data as any).PD_warranty} Months</div>
                </div>
              </div>
            </section>`
            : ''
        }

        ${
          hasAdditionalInfo
            ? `<section class="section avoid-break">
              <div class="section-header">
                <div class="section-icon"><i class="fa-solid fa-circle-info"></i></div>
                <h2 class="section-title">Additional Information</h2>
              </div>
              <div class="info-grid">
                ${
                  (data as any).PD_certificate
                    ? `<div class="info-row">
                      <div class="info-label">Certifications</div>
                      <div class="info-value">${(data as any).PD_certificate}</div>
                    </div>`
                    : ''
                }
                ${
                  (data as any).PD_military_grade
                    ? `<div class="info-row">
                      <div class="info-label">Military Grade</div>
                      <div class="info-value">${(data as any).PD_military_grade}</div>
                    </div>`
                    : ''
                }
                ${
                  (data as any).PD_asus_exclusive_technology
                    ? `<div class="info-row">
                      <div class="info-label">Exclusive Technology</div>
                      <div class="info-value">${(data as any).PD_asus_exclusive_technology}</div>
                    </div>`
                    : ''
                }
              </div>
            </section>`
            : ''
        }

      </div>
    </body>
  </html>
  `;
}
