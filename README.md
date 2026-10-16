# DigUp for Raycast

Search the [DigUp](https://github.com/ARahim3/DigUp) index in Raycast. **Search DigUp** shows matching files as you type; press Return to open the selected file.

## Install locally

1. Install DigUp and complete its setup so its index is searchable.
2. Run `npm install` and `npm run dev` in this directory to import the extension into Raycast.
3. Run **Search DigUp** in Raycast. You can assign it a hotkey or alias in Raycast settings.

If Raycast cannot find DigUp, set **DigUp App Path** to the full path of the `.app` bundle. If DigUp uses custom locations, set **Index Path** and **Models Path** in the extension preferences. The extension calls the `digup` helper bundled with that app and reads its index; it does not create a separate index.

Opening a result uses the macOS default app for that file. For DigUp's document previews or location within a video, open the DigUp app.

This extension is an independent project and is not affiliated with the DigUp maintainers.
