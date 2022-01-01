import RGBColor from "./RGBColor";
import debounce from "lodash.debounce";
import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `
    <button id="connect">Connect to device</button>
    <p id="error" style="display: none"></p>
    <input type="color" disabled name="color" id="color">
    <input type="range" disabled name="brightness" id="brightness" min=0 max=100>
`;

const connectBtn = document.querySelector<HTMLButtonElement>("#connect")!;
const errorField = document.querySelector<HTMLParagraphElement>("#error")!;
const colorInput = document.querySelector<HTMLInputElement>("#color")!;
const brightnessInput =
  document.querySelector<HTMLInputElement>("#brightness")!;

const LED_SERVICE_UUID: BluetoothServiceUUID =
  "be0bae1d-3625-4362-81e3-3b96f709bd66";
const COLOR_CHARACTERISTIC_UUID: BluetoothCharacteristicUUID =
  "d6d92a13-44a1-4fe9-a868-e9a3ebaeafed";
const BRIGHTNESS_CHARACTERISTIC_UUID: BluetoothCharacteristicUUID =
  "3ce1e5b3-16fb-473b-85b4-e3389ca4558c";

(async () => {
  if (!navigator.bluetooth || !(await navigator.bluetooth.getAvailability())) {
    connectBtn.disabled = true;
    errorField.textContent =
      'Your Browser or your device does not support the Web Bluetooth API 😔\n Make sure your device has Bluetooth capability and that you are using the Chrome/Chromium Browser with the flag "Experimental Web Platform features" enabled.';
  }
})();

connectBtn.onclick = async () => {
  const onColorChange = debounce(
    async (e: Event) => {
      if (e.target instanceof HTMLInputElement) {
        console.log("C:", e.target.value);
        await colorCharacteristic?.writeValue(
          RGBColor.fromHex(e.target.value).toDataView()
        );
      }
    },
    100,
    { trailing: true }
  );
  const onBrightnessChange = debounce(
    async (e: Event) => {
      if (e.target instanceof HTMLInputElement) {
        console.log("B:", e.target.value);
        const newBrightness = new DataView(new ArrayBuffer(2));
        newBrightness.setUint16(0, e.target.valueAsNumber, true);
        await brightnessCharacteristic?.writeValue(newBrightness);
      }
    },
    75,
    { trailing: true }
  );

  colorInput.removeEventListener("change", onColorChange);
  brightnessInput.removeEventListener("input", onBrightnessChange);

  colorInput.addEventListener("change", onColorChange);
  brightnessInput.addEventListener("input", onBrightnessChange);

  const device = await navigator.bluetooth.requestDevice({
    filters: [{ name: "RGB Strip" }],
    optionalServices: [LED_SERVICE_UUID],
  });

  const server = await device.gatt?.connect();

  if (!server) {
    return (errorField.textContent = "Unable to connect to device");
  }

  const rgbService = await server.getPrimaryService(LED_SERVICE_UUID);

  if (!rgbService) {
    return (errorField.textContent = "Unable to get rgb service");
  }

  const colorCharacteristic = await rgbService.getCharacteristic(
    COLOR_CHARACTERISTIC_UUID
  );
  const brightnessCharacteristic = await rgbService.getCharacteristic(
    BRIGHTNESS_CHARACTERISTIC_UUID
  );

  if (!colorCharacteristic || !brightnessCharacteristic) {
    return (errorField.textContent = "Unable to get rgb characteristics");
  }

  const colorCharacteristicValue = await colorCharacteristic.readValue();
  const brightnessCharacteristicValue =
    await brightnessCharacteristic.readValue();

  if (!colorCharacteristicValue || !brightnessCharacteristicValue) {
    return (errorField.textContent = "Unable to get color data");
  }

  const currentColor = RGBColor.fromDataView(colorCharacteristicValue);
  const currentBrightness = brightnessCharacteristicValue.getUint16(0, true);

  colorInput.value = currentColor.toHex();
  brightnessInput.valueAsNumber = currentBrightness;
  colorInput.disabled = false;
  brightnessInput.disabled = false;
  return;
};
