import { View } from 'react-native'
import React from 'react'
import AppLayout from '../../../../../components/layout/AppLayout'
import { useRoute } from '@react-navigation/native';


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
export default function ProductDescription() {
    const route = useRoute();
    const { product } = route.params as { product: ProductInfoItem };
    console.log('Product Description:', product);
  return (
    <AppLayout title='Product Description' needBack needPadding>
        <View>

        </View>
    </AppLayout>
  )
}

const sampleProduct: ProductInfoItem = {
    PD_ID: 3,
    PD_part_number: "90NR0BI1-M002Y0",
    PD_product_line_id: "NR",
    PD_sales_model_name: "GX650PY-NM052WS",
    PD_processor: "AMD Ryzen™ 9 7945HX Mobile Processor (16-core/32-thread, 64MB L3 cache, up to 5.4 GHz max boost)",
    PD_memory_installed: "DDR5 32GB ( 16GB DDR5-4800 SO-DIMM *2 )",
    PD_storage_installed: "2TB PCIE G4 (PERFORMANCE) SSD",
    PD_graphic: "NVIDIA® GeForce RTX™ 4090 Laptop GPU (686 AI TOPs)",
    PD_operating_system: "Windows 11 Home\nOffice Home and Student",
    PD_display: "16.0  WQXGA 2560X1600 16:10 Bend+1100nits (HDR) Anti-Glare DCI-P3:100% Wide View",
    PD_color: "Black",
    PD_driver_bay: "",
    PD_expansion_slot: "2x DDR5 SO-DIMM slots\n2x M.2 PCIe",
    PD_camera: "1080P FHD camera",
    PD_audio: "4-speaker (dual-force woofer) system with Smart Amplifier Technology, 2 Tweeters\nAI noise-canceling technology\nDolby Atmos\nHi-Res certification (for headphone)\nSmart Amp Technology\nSupport Microsoft Cortana near field/far field (Microsoft service suspended in spring of 2023.)\nBuilt-in 3-microphone array",
    PD_wireless_connectivity: "Wi-Fi 6E(802.11ax) (Triple band) 2*2 + Bluetooth® 5.3 Wireless Card (*Bluetooth® version may change with OS version different.)",
    PD_interface: "1x 2.5G LAN port\n1x USB 3.2 Gen 2 Type-C with support for DisplayPort™ / G-SYNC (data speed up to 10Gbps)\n1x USB 3.2 Gen 2 Type-C with support for DisplayPort™ / power delivery / G-SYNC (data speed up to 10Gbps)\n2x USB 3.2 Gen 2 Type-A (data speed up to 10Gbps)\n1x card reader (microSD) (UHS-II, 312MB/s)\n1x 3.5mm Combo Audio Jack\n1x HDMI 2.1 FRL",
    PD_input_device: "Backlit Chiclet Keyboard Per-Key RGB\nScreenPad™ Plus (14\" 3840 x 1100(4K) IPS-level Panel Support Stylus)\nSupport NumberPad\nTouchpad",
    PD_security: "BIOS Administrator Password and User Password Protection\nTrusted Platform Module (Firmware TPM)",
    PD_included_in_the_box: "ROG Gladius III Mouse P514\nROG Ranger BP2701 Gaming Backpack\nROG Fusion II 300\nPalm rest",
    PD_weight_and_dimension: "2.67 Kg (5.89 lbs)\n35.5 x 26.6 x 2.05 ~ 2.97 cm (13.98\" x 10.47\" x 0.81\" ~ 1.17\")",
    PD_warranty: "12",
    PD_optional_accessory: "",
    PD_certificate: "",
    PD_vga: "NV RTX4090",
    PD_vram: "16GB",
    PD_battery: "90WHrs, 4S1P, 4-cell Li-ion",
    PD_power: "ø6.0, 330W AC Adapter, Output: 20V DC, 16.5A, 330W, Input: 100~240C AC 50/60Hz universal",
    PD_screenpad: "ScreenPad™ Plus (14\" 3840 x 1100(4K) IPS-level Panel Support Stylus)",
    PD_numpad: "Support NumberPad",
    PD_display_oled: "",
    PD_display_lcd_type: "IPS",
    PD_card_reader: "",
    PD_tpm: "",
    PD_antivirus: "N/A",
    PD_office: "OFFICE HOME&STUDENT(IN)",
    PD_chipset: "",
    PD_form_factor: "Notebook - Ultraslim",
    PD_cfg_fingerprint: "WO/FINGERPRINT",
    PD_military_grade: "",
    PD_asus_exclusive_technology: "",
    PD_xbox_game_pass: "",
    PD_graphic_wattage: "ROG Boost: 2090 MHz* at 175W (2040MHz Boost Clock+50MHz OC, 140W+15W Dynamic Boost in Turbo Mode, 150W+25W in Manual Mode)",
    UPD_BANNED: "A",
    UPD_BANNEDON: "2050-01-01T00:00:00",
    UPD_PROPERTY: "MUM",
    UPD_COUNTRY: "ASIN",
    UPD_BRANCH: "HO",
    UPD_USER: "KN2300054",
    UPD_TODAY: "2025-03-20T21:20:07.87",
    UPD_MODULE: "INS",
    UPD_MACHINENAME: "::1",
    PD_Image1: "",
    PD_Image2: "",
    PD_Image3: "",
    PD_Image4: "",
    PD_Image5: "",
    PD_Image6: "",
    PD_Image7: "",
    PD_Image8: "",
    PD_Image9: "",
    PD_Image10: "",
    PD_Made_In_India: "N",
    PD_Display_Touch: "non-Touch",
    PD_Screen_Type: "IPS",
    PD_Refresh_Rate: "240Hz",
    PD_Neural_Processor: ""
}