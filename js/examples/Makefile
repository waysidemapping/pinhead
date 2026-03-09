GET_SPRITE := node ../cli.js get-sprite

SCRIPTS := Makefile ../index.js ../cli.js

ALL := \
	jeep-map_pin-stroke-1.svg \
	cargobike-square-blue.svg \
	bike-circle-green.svg \
	cafe-black-stroke.svg \
	burger-marker.svg \
	dot.svg \
	cargobike.svg \
	sun-square-yellow.svg \
	plane-square-navy.svg \
	ice_cream-circle-pink.svg \
	beer-marker-amber.svg \
	rocket-map_pin-purple.svg \
	pizza-square-red.svg \
	bus-circle-blue.svg \
	camera-marker-darkgrey.svg \
	tree-map_pin-green.svg \
	tent-square-brown.svg

all: $(ALL)
 
jeep-map_pin-stroke-1.svg: $(SCRIPTS)
	$(GET_SPRITE) jeep --shape=map_pin --strokeWidth=1 > $@

cargobike-square-blue.svg: $(SCRIPTS)
	$(GET_SPRITE) cargobike --shape=square --shapeFill='#6486f5' > $@

bike-circle-green.svg: $(SCRIPTS)
	$(GET_SPRITE) bicycle --shape=circle --strokeWidth=1 --stroke='#6dad6f' --fill='#6dad6f' --shapeFill="white"> $@

burger-marker.svg: $(SCRIPTS)
	$(GET_SPRITE) burger --shape=marker --shapeFill="#3FB1CE" > $@

cafe-black-stroke.svg: $(SCRIPTS)
	$(GET_SPRITE) cup_and_saucer --strokeWidth=1 > $@

cargobike.svg: $(SCRIPTS)
	$(GET_SPRITE) cargobike > $@

dot.svg: $(SCRIPTS)
	$(GET_SPRITE) dot > $@

sun-square-yellow.svg: $(SCRIPTS)
	$(GET_SPRITE) sun --shape=square --cornerRadius=7 --shapeFill='yellow' --strokeWidth=1 > $@

plane-square-navy.svg: $(SCRIPTS)
	$(GET_SPRITE) plane --shape=square --cornerRadius=0 --shapeFill='navy' > $@

ice_cream-circle-pink.svg: $(SCRIPTS)
	$(GET_SPRITE) ice_cream_on_cone --shape=circle --shapeFill='pink' > $@

beer-marker-amber.svg: $(SCRIPTS)
	$(GET_SPRITE) beer_mug_with_foam --shape=marker --shapeFill='#FFBF00' > $@

rocket-map_pin-purple.svg: $(SCRIPTS)
	$(GET_SPRITE) rocketship --shape=map_pin --shapeFill='purple' > $@

pizza-square-red.svg: $(SCRIPTS)
	$(GET_SPRITE) pizza_slice --shape=square --shapeFill='red' > $@

bus-circle-blue.svg: $(SCRIPTS)
	$(GET_SPRITE) bus --shape=circle --shapeFill='blue' > $@

camera-marker-darkgrey.svg: $(SCRIPTS)
	$(GET_SPRITE) camera --shape=marker --shapeFill='#333' > $@

tree-map_pin-green.svg: $(SCRIPTS)
	$(GET_SPRITE) conifer_tree --shape=map_pin --shapeFill='darkgreen' > $@

tent-square-brown.svg: $(SCRIPTS)
	$(GET_SPRITE) a_frame_tent --shape=square --shapeFill='brown' > $@

.PHONY: clean
clean:
	rm -rf $(ALL)
