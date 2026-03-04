from qgis.core import QgsApplication
import os

class PinheadPlugin:
  def __init__(self, iface):
    plugin_dir = os.path.dirname(__file__)
    self.svg_path = os.path.join(plugin_dir, "icons")
    pass

  def initGui(self):
    paths = QgsApplication.svgPaths()
    if self.svg_path not in paths:
      paths.append(self.svg_path)
      QgsApplication.setSvgPaths(paths)

  def unload(self):
    paths = QgsApplication.svgPaths()
    if self.svg_path in paths:
      paths.remove(self.svg_path)
      QgsApplication.setSvgPaths(paths)