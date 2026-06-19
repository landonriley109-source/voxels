# Voxels v38 Audio Quick Fix

Built from Voxels v37 Custom Audio Web.

## What changed

v37 tried to save the entire uploaded song into localStorage. That made normal songs fail because localStorage is too small.

v38 fixes this by using browser object URLs:

- Normal-sized songs should work better.
- Audio files are not saved after refresh.
- Players must re-upload custom songs after reloading the page.
- The game only remembers the previous file name.
- Menu/world music volume still goes up to 200%.

This is the quick fix. A later IndexedDB version would allow larger songs to be saved permanently.

Open `index.html` in a browser.


# Voxels v37 Custom Audio

Built from Voxels v36 Custom Texture Packs Web.

## New in v37

- Upload custom audio files as menu music.
- Upload custom audio files as world music.
- Reset custom menu/world music separately.
- Menu music and world music volume sliders now go up to 200%.
- Custom audio saves locally in that player's browser.

## Notes

- Smaller audio files work better because browser localStorage has size limits.
- If a file is too large, use a shorter or compressed audio file.
- Custom music loops automatically.

Open `index.html` in a browser.


# Voxels v36 Custom Texture Packs

Built from Voxels v35 Profile & UI Web.

## New in v36

- Added Custom Texture Pack Import in the Textures tab.
- Supports ZIP texture packs when JSZip is available.
- Supports loose PNG uploads as a fallback.
- Missing textures fall back to the normal/current textures.
- Imported packs save locally in that player's browser.
- Added Reset Custom Pack button.

## Texture names supported

Use PNG files named like:

- grass.png
- grass_side.png
- dirt.png
- stone.png
- sand.png
- wood.png
- leaf.png
- brick.png
- planks.png
- glass.png
- coal.png
- water.png
- cobble.png
- gold.png
- snow.png
- clay.png
- basalt.png
- moss.png
- pillar_wood.png
- dark_planks.png

You can upload only one block texture if you want. The rest will stay default.

Open `index.html` in a browser.


# Voxels v35 Profile & UI

Built from Voxels v34 Texture Packs Web.

## New in v35

- Added Profile tab in Settings.
- Added username setting.
- Added preset profile pictures:
  - Grass Block
  - Stone Block
  - Gold Block
  - Sun
  - Castle
  - Cross
- Added profile preview and menu profile badge.
- Added UI Style Presets:
  - Classic
  - Extra Blocky
  - Minecrafty
  - Transparent
  - Liquid Glass

Open `index.html` in a browser.


# Voxels v34 Texture Packs

Built from Voxels v33 Visual & Audio FIXED.

## New in v34

Added a major Texture Pack setting that redraws the actual block textures.

Texture Packs:
- Voxels Default
- Crafty Blocks
- Smooth Plastic
- Medieval Stones
- Neon Arcade

This is different from the old Texture Preset setting:
- Texture Pack changes the actual block art.
- Texture Preset changes style values like contrast/saturation/sharpness.

Open `index.html` in a browser.


# Voxels v33 Visual & Audio FIXED

Built from Voxels v32 Sneak Edges + Delete Data Web.

## Fixed build notes

This version avoids the broken v33 merge and keeps the original menu structure intact.

## New in v33

- Texture presets include Minecrafty, Soft Builder, Dark Medieval, Retro Bright, and more.
- Screen filters: Classic, Vivid, Grayscale, Sunglasses Tint.
- Menu music song selection.
- World music toggle, song selection, and volume.

Open `index.html` in a browser.


# Voxels v32 Sneak Edges + Delete Data

Built from Voxels v31 Sneak Edges Web.

## Included

- Sneak/crouch edge protection from v31 Sneak Edges.
- New Delete This Copy's Data button in Settings.
- Deletes saved worlds and resets settings for that browser/device.
- Reloads the game cleanly after deletion.

Open `index.html` in a browser.


# Voxels v31 Sneak Edges

Built from stable Voxels v30 Web.

## New in this version

- Crouching/sneaking now prevents walking off block edges.
- While crouching, you stay on the edge until you uncrouch.
- Creative mode crouch behavior is unchanged.

Open `index.html` in a browser.


# Voxels v30 Web

## New in v30

- Added a proper distant sky sun.
- Sun is rendered as a camera-facing square billboard.
- Walking toward the sun no longer makes it feel closer.
- Added Distant Billboard Sun toggle in Video settings.
- Browser/web package: open `index.html`.

## How to run

Extract the ZIP and open `index.html`.

If local files are blocked, run:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```


# Voxels v29

Built from stable Voxels v26.

## New in v29

- Added Motion Blur toggle in Video Settings.
- Added Motion Blur Strength slider.
- Motion blur activates while looking around with the mouse.
- Kept v26 stable save/load and panorama base.

Open `index.html` in a browser, or use the Windows launcher if included.


# Voxels v26

## New in v26

- Hotbar slots now clear automatically when that block count reaches 0.
- Survival hotbar no longer shows items with an amount of 0.
- If the selected slot empties, the game tries to select the next usable slot.

Open `index.html` in a browser, or use the Windows launcher if included.


# Voxels v25

## New in v25

- Major blocky UI overhaul.
- Menus now use chunky pixel-style borders.
- Buttons, sliders, tabs, and panels look more Minecraft-like.
- Hotbar slots are more blocky.
- Inventory panels and world rows have heavier pixel borders.
- Health, HUD, and break bar now use stronger blocky styling.

Open `index.html` in a browser, or use the Windows launcher if included.


# Voxels v24

## New in v24

- Fixed church cross placement.
- Added Worlds menu.
- Saved worlds are now listed separately.
- Create World now asks for a world name.
- You can play or delete saved worlds from the Worlds menu.
- Press P in-game to save the current world.

Open `index.html` in a browser, or use the Windows launcher if included.


# Voxels v23

## New in v23

- Added Show Sun In Sky toggle in Gameplay.
- Day/night cycle can now run with the visible sun hidden.
- Churches now spawn with a wooden cross on top.

Open `index.html` in a browser, or use the Windows launcher if included.


# Voxels v22 Stable

## Stability repair

- Rolled back the risky v21 shader rewrite that could stop the game from launching.
- Restored safe menu panorama generation.
- Added safer startup fallback if panorama generation fails.
- Keeps day/night, time controls, menu music, panorama settings, churches, and Super Graphics approximations.
- This build prioritizes launching and playability over experimental shadows.

Open `index.html` in a browser, or use the Windows launcher if included.


# Voxels v20

## New in v20

- Sun rises in the east and sets in the west over time.
- Added Day/Night Cycle toggle.
- Added Time Speed slider.
- Added Set Time options:
  - Sunrise
  - Day
  - Noon
  - Sunset
  - Night
- Sky is blue near noon, colorful at sunrise/sunset, and black at night.
- Shadows fade out at night.
- Super Graphics shadows now cast based on the moving sun position.

Open `index.html` in a browser, or use the Windows launcher if included.


# Voxels v19

## New in v19

- Auto-step is now toggleable in Gameplay.
- Clouds are off by default.
- Sun rendering is prettier with layered glow.
- Super Graphics makes the sun shine stronger.

Open `index.html` in a browser, or use the Windows launcher if included.


# Voxels v18

## New in v18

- Added Creative Sprint Speed slider in Gameplay.
- Jump height increased so players can clear one-block ledges.
- Added simple auto-step for smoother one-block movement.
- Menu music, panorama settings, and church generation retained.

Open `index.html` in a browser, or use the Windows launcher if included.


# Voxels v17

## New in v17

- Panorama settings moved to Gameplay.
- Panorama choices now generate visibly different menu worlds.
- Jumping is less floaty.
- Added calm procedural menu music.
- Added menu music toggle and volume in Audio Settings.

Open `index.html` in a browser, or use the Windows launcher if included.


# Voxels v16

## New in v16

- Removed F5 camera modes.
- Removed player skin settings.
- Game is first-person only again.
- Panorama choices:
  - Classic
  - Mountain World
  - Flatworld
  - Desert
- At least one small stone church now spawns in every world.

Open `index.html` in a browser, or use the Windows launcher if included.


# Voxels v15

Renamed from BlockLite to Voxels.

## New in v15

- Game name changed to Voxels.
- Menu panorama settings:
  - Default Plains
  - Mountain View
  - Desert Sunset
  - Flat Builder World
  - Spin speed
- F5 toggles camera mode:
  - First person
  - Third person
  - Second person/front camera
- Player skins:
  - Classic
  - Builder
  - Explorer
  - Shadow
  - Royal

Open `index.html` in a browser, or use the Windows launcher if included.


# BlockLite Major Update v14

## New in v14

- Create World menu added.
- World generation moved out of Settings.
- Presets: Default, Flatworld, Mountain World, Desert.
- Added FOV control.
- Added Creative break speed control.
- Render distance slider supports up to 50,000.
- Added naturally generating small stone churches.

Open `index.html` in a browser, or use the Windows launcher if included.


# BlockLite Major Update v13

A lightweight original voxel sandbox game that runs in the browser.

## New in v13

- Survival is less punishing:
  - Fall damage starts after a larger fall.
  - Fall damage multiplier is lower.
- Death now wipes all inventory and hotbar blocks.
- Creative mode added:
  - Toggle it in Settings.
  - Infinite blocks.
  - Flying is always allowed.
  - Blocks break instantly.
  - Broken blocks are not collected.
- Video settings added:
  - Graphics preset
  - Render distance
  - Resolution scale
  - Brightness
  - Lighting contrast
  - Fog
  - Smooth lighting
  - 3D menu panorama
  - Vignette
- Sprint works on ground and while flying.
- Creative-off flight bug fixed.
- Sun and clouds are fixed 3D sky objects, not screen overlays.
- World generation presets added:
  - Default
  - Flatworld
  - Mountain World
- Clouds are scattered above the world as blocky Minecraft-like 3D clusters and avoid covering the sun.
- Super Graphics shadows now use a longer sun-position-based world-space shadow approximation.
- Reflection shine is stronger and reacts more to the fake sun-facing direction.
- Render distance slider now goes up to 50,000.
- New tabbed settings menu.
- Pixelated Mojangles-inspired UI font style.
- Super Graphics now reveals its own tab with shadows, reflection shine, bloom, and intensity controls.
- New sky settings: clouds, cloud amount, sun glow.
- Left/right movement controls fixed.
- Mountains generate more commonly and more dramatically.
- Built-in generated sound effects added for walking, breaking, placing, falling, and dying.
- Grass blocks now have visible dirt under the grass on side faces.
- Sprint has been restored as its own control.
- Crouch/descend is now a separate control.
  - Default Sprint: Shift.
  - Default Crouch/Descend: C.
  - Survival players crouch and move slower/lower.
  - Creative players use C to descend closer to the ground.
- Extremely high render-distance ceiling, now up to 10,000.
- Mountainous hill terrain can now generate sometimes.
- Block texture presets added:
  - Classic
  - Soft
  - Crisp
  - Vivid
  - Moody
- More texture customization:
  - Texture contrast
  - Texture saturation
  - Pixel sharpness
- More lighting customization:
  - Ambient light
  - Fog density
  - Sky warmth
- Textures improved again with more noise, highlights, outlines, veins, and material detail.

## Run

Open `index.html`.

If your browser blocks local behavior, use a local server:

```bash
cd BlockLite_Client_Major_Update_v13
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Controls

Default controls:

- WASD: move
- Mouse: look
- Space: jump
- R: sprint
- Left Shift: crouch / descend in Creative
- Hold left click: break block
- Right click: place block
- Mouse wheel: scroll hotbar
- 1-9: select hotbar slot
- E: inventory
- F: fly mode in Survival
- P: save world
- L: load world
- Esc: pause/settings

## Notes

This is not Minecraft, Eaglercraft, or a cracked client. It is an original mini voxel engine inspired by block-building sandbox games.

## Windows app launcher

Use `Start_BlockLite_Windows.bat` to launch the game like a simple Windows desktop app. It opens the local HTML game in your default browser without needing to manually browse to the file.


## Super Graphics limit

Super Graphics cannot become true RTX in this version because the game uses a very small custom WebGL renderer, not a full engine with shadow maps, screen-space reflections, physically based materials, deferred lighting, or ray tracing. The current Super Graphics mode can fake stronger shadows, reflections, bloom, and atmosphere, but true RTX-style graphics would require a much deeper renderer rewrite.
