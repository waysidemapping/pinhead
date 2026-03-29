# pinhead-qgis-resources

This repository is the official distribution of [Pinhead](https://pinhead.ink) icons formatted for use in [QGIS](https://qgis.org/) via the [QGIS Resource Sharing plugin](https://github.com/QGIS-Contribution/QGIS-ResourceSharing/) ([install page](https://plugins.qgis.org/plugins/qgis_resource_sharing/)). These icons are SVG files generally intended to be displayed as POI markers on maps.

## Community and support

For technical reasons, this repository is separate from the [main Pinhead repo](https://github.com/waysidemapping/pinhead). Bug reports, icon requests, etc. should be directed there. Come collaborate with us!

## Usage

If you haven't already, start by [installing QGIS](https://qgis.org/resources/installation-guide/).

### Installing the plugin

Then, [install the QGIS Resource Sharing plugin](https://qgis-contribution.github.io/QGIS-ResourceSharing/usage/installation.html):

1. From the menubar, open "Plugins" -> "Manage and Install Plugins…"
2. Search for and select the "QGIS Resource Sharing" plugin
3. Click "Install Plugin"
4. Close the window

### Installing the Pinhead icon collection

Next, add the Pinhead icons:

1. From the menubar, open "Plugins" -> "QGIS Resource Sharing" -> "Resource Sharing"
2. In the "All collections" tab, select "Pinhead SVG Icons (Pinhead)"
3. Click "Install"
4. Close the window

### Using the icons on a map

After installing the collection, the Pinhead icons will now become available in the SVG browser. For example, to use the icons with a point layer:
  
1. Open the Layer Properties window (e.g. double click on the layer)
2. Go to the Symbology tab
3. Select or add a marker
4. Select the "SVG Marker" symbol layer type
5. Select "User Symbols" -> "Pinhead SVG Icons (Pinhead)" -> "SVG" under SVG Groups in the SVG browser
6. Select the icon you want to use
7. Style it however you like!
  
This process creates references from the layers to specific files on your computer. The Pinhead filenames are stable, meaning nothing will change if you update the collection. However, if you uninstall this plugin then these icons will disappear from your project. You can reinstall this plugin at any time to recover them. If you want to share a project to a setup that doesn't have this plugin installed, then you'll need to copy the SVG files directly into your project directory.

## License

CC0. See [/LICENSE](/LICENSE).
