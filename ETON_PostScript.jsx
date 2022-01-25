#target photoshop
var scriptFolder = (new File($.fileName)).parent; // The location of this script

// Keeping the ruler settings to reset in the end of the script
var startRulerUnits = app.preferences.rulerUnits;
var startTypeUnits = app.preferences.typeUnits;
var startDisplayDialogs = app.displayDialogs;

// Changing ruler settings to pixels for correct image resizing
app.preferences.rulerUnits = Units.PIXELS;
app.preferences.typeUnits = TypeUnits.PIXELS;
app.displayDialogs = DialogModes.NO;

// VARIABLES

var defineVariablesHere;
var errorLog = [];

try {
    init();
} catch(e) {
    alert("Error code " + e.number + " (line " + e.line + "):\n" + e);
}

// Reset the ruler
app.preferences.rulerUnits = startRulerUnits;
app.preferences.typeUnits = startTypeUnits;
app.displayDialogs = startDisplayDialogs;

function init() {
    
    // Preparation before running the main script
    try {
        activeDocument.activeLayer = activeDocument.layers.getByName("Group 1");
    } catch(e) {
        if (activeDocument) {
            activeDocument.suspendHistory("Name to be shown in history window", "main()");
        } else {
            main();
        }
    }

}

function main() {

    unlockBackground();
    selectToAdj();
    makeGroup();
    moveAdjMask();
    createSolidColour();
    activeDocument.activeLayer.name = "Eton BG Colour #d6d0c6";

    // Move cloth
    var variants_Cloth = ["Cloth", "cloth", "CLOTH", "clothe", "Clothe", "Cloths", "cloths", "clothes", "Clothes", "garment", "Garment", "garments", "Garments"];
    var lyr_Cloth = findLayer(variants_Cloth,"LayerSet")
    if (lyr_Cloth.length) {
        for (i = 0; i < lyr_Cloth.length; i++) {
            lyr_Cloth[i].move(activeDocument.layerSets.getByName("Group 1").layerSets.getByName("Adj"), ElementPlacement.PLACEBEFORE);
            lyr_Cloth[i].name = "Garment";
        }
    } else if (lyr_Cloth != null) {
        lyr_Cloth.move(activeDocument.layerSets.getByName("Group 1").layerSets.getByName("Adj"), ElementPlacement.PLACEBEFORE);
        lyr_Cloth.name = "Garment";
    } else {
        errorLog.push(activeDocument.name + ": Failed to find and/or move the \"Cloth\" layer");
    }

    // Rename adj to group 1
    var variants_Adj = ["Adj", "adj", "ADJ", "ADj", "adjustment", "adjustments", "Adjustment", "Adjustments", "ADJUSTMENT", "ADJUSTMENTS"];
    var lyr_Adj = findLayer(variants_Adj,"LayerSet")
    if (lyr_Adj.length) {
        for (i = 0; i < lyr_Adj.length; i++) {
            activeDocument.activeLayer = lyr_Adj[i];
            functionLayerColour("None");
            removeMask();
        }
    } else if (lyr_Adj != null) {
        activeDocument.activeLayer = lyr_Adj;
        functionLayerColour("None");
        removeMask();
    } else {
        errorLog.push(activeDocument.name + ": Failed to find the \"Adj\" layer to remove mask");
    }

    // Move dodge and burn
    var variants_DodgeAndBurn = ["Dodge and Burn", "Dodge And Burn", "Dodge and burn", "dodge and burn", "Dodge & Burn", "Dodge & burn", "Dodge Burn", "Dodge burn", "dodge burn"];
    var lyr_DodgeAndBurn = findLayer(variants_DodgeAndBurn,"LayerSet")
    if (lyr_DodgeAndBurn.length) {
        for (i = 0; i < lyr_DodgeAndBurn.length; i++) lyr_DodgeAndBurn[i].move(activeDocument.layerSets.getByName("Group 1").layerSets.getByName("Adj"), ElementPlacement.PLACEAFTER);
    } else if (lyr_DodgeAndBurn != null) {
        lyr_DodgeAndBurn.move(activeDocument.layerSets.getByName("Group 1").layerSets.getByName("Adj"), ElementPlacement.PLACEAFTER);
    } else {
        errorLog.push(activeDocument.name + ": Failed to find and/or move the \"Dodge and burn\" layer");
    }

    // Error log save
    if (errorLog.length != 0) {
        var d = new Date();
        var date = d.getFullYear() + "/" + (d.getMonth() + 1) + "/" + d.getDate() + " " + d.getHours() + ":" + d.getMinutes();
        saveTxt(date + "\n\n" + errorLog.join("\n---\n"), "errorlog", scriptFolder, ".txt");
        alert(errorLog.length + " errors has been logged to a file in this location:\n" + decodeURI(scriptFolder));
    }

}

// FUNCTIONS

function findLayer(nameInput, type) {
	
	function diveDeeper(layerInput) {
		
        if (typeof nameInput == "string") {
            if (type == "Any") {
                if (layerInput.name == nameInput) results.push(layerInput);
            }  else {
                if (layerInput.name == nameInput && layerInput.typename == type) results.push(layerInput);
            }
        } else {
            while (layerInput.name != nameInput[variantIndex]) {
                variantIndex++;
                if (variantIndex >= nameInput.length) break;
            }

            if (type == "Any") {
                if (layerInput.name == nameInput[variantIndex]) results.push(layerInput);
            }  else {
                if (layerInput.name == nameInput[variantIndex] && layerInput.typename == type) results.push(layerInput);
            }

            variantIndex = 0;
        }
		
		if (layerInput.typename === "LayerSet") {
			if (layerInput.layers.length > 0) {
				for (var indexDive = layerInput.layers.length - 1; indexDive > -1; indexDive--) diveDeeper(layerInput.layers[indexDive]);
			}
		}
		
	}
	
    var variantIndex = 0;
	var results = [];

    for (var indexAll = 0; indexAll < activeDocument.layers.length; indexAll++) diveDeeper(activeDocument.layers[indexAll]);
	
	if (!results.length) return null;
	if (results.length == 1) return results[0];
	if (results.length > 1) return results;
	
}

function exploreLayer(layerInput) { // Input a layer object (ie. activeDocument.activeLayer) to explore.
	
	// If the layer input is a layer set, the script will iterate through the group starting from the bottom (for clipping mask reason)
	// If the layer input is an art layer it will result in the last "else" only
	
	// "layerInput" is the current layer and "layerInput.parent" is the parent group 


	
	if (layerInput.typename === "LayerSet"){
		if (layerInput.layers.length > 0){
			for (var i = layerInput.layers.length-1; i > -1; i--) exploreLayer(layerInput.layers[i]);
		} else {
			// If a group is empty
		}
	} else if (layerInput.parent == activeDocument) {
		
		// If the input layer isn't in any group at all
		
	} else {
		
		// This is the only result, if the input layer is an art layer
		
	}
	
}

function unlockBackground() {
    try {

        activeDocument.activeLayer = activeDocument.layers[activeDocument.layers.length - 1];
        if (!activeDocument.activeLayer.isBackgroundLayer) return;

        var idsetd = charIDToTypeID( "setd" );
            var desc224 = new ActionDescriptor();
            var idnull = charIDToTypeID( "null" );
                var ref2 = new ActionReference();
                var idLyr = charIDToTypeID( "Lyr " );
                var idBckg = charIDToTypeID( "Bckg" );
                ref2.putProperty( idLyr, idBckg );
            desc224.putReference( idnull, ref2 );
            var idT = charIDToTypeID( "T   " );
                var desc225 = new ActionDescriptor();
                var idOpct = charIDToTypeID( "Opct" );
                var idPrc = charIDToTypeID( "#Prc" );
                desc225.putUnitDouble( idOpct, idPrc, 100.000000 );
                var idMd = charIDToTypeID( "Md  " );
                var idBlnM = charIDToTypeID( "BlnM" );
                var idNrml = charIDToTypeID( "Nrml" );
                desc225.putEnumerated( idMd, idBlnM, idNrml );
            var idLyr = charIDToTypeID( "Lyr " );
            desc224.putObject( idT, idLyr, desc225 );
            var idLyrI = charIDToTypeID( "LyrI" );
            desc224.putInteger( idLyrI, 52 );
        executeAction( idsetd, desc224, DialogModes.NO );

    } catch(e) {

    }
}

function selectToAdj() {
    var idslct = charIDToTypeID( "slct" );
        var desc276 = new ActionDescriptor();
        var idnull = charIDToTypeID( "null" );
            var ref12 = new ActionReference();
            var idLyr = charIDToTypeID( "Lyr " );
            ref12.putName( idLyr, "Adj" );
        desc276.putReference( idnull, ref12 );
        var idselectionModifier = stringIDToTypeID( "selectionModifier" );
        var idselectionModifierType = stringIDToTypeID( "selectionModifierType" );
        var idaddToSelectionContinuous = stringIDToTypeID( "addToSelectionContinuous" );
        desc276.putEnumerated( idselectionModifier, idselectionModifierType, idaddToSelectionContinuous );
        var idMkVs = charIDToTypeID( "MkVs" );
        desc276.putBoolean( idMkVs, false );
        var idLyrI = charIDToTypeID( "LyrI" );
            var list10 = new ActionList();
            list10.putInteger( 1 );
            list10.putInteger( 25 );
            list10.putInteger( 26 );
            list10.putInteger( 29 );
            list10.putInteger( 30 );
            list10.putInteger( 31 );
            list10.putInteger( 32 );
            list10.putInteger( 15 );
            list10.putInteger( 16 );
            list10.putInteger( 17 );
            list10.putInteger( 18 );
            list10.putInteger( 19 );
            list10.putInteger( 45 );
            list10.putInteger( 46 );
            list10.putInteger( 47 );
            list10.putInteger( 24 );
            list10.putInteger( 34 );
        desc276.putList( idLyrI, list10 );
    executeAction( idslct, desc276, DialogModes.NO );
}

function makeGroup() {
    var idMk = charIDToTypeID( "Mk  " );
        var desc286 = new ActionDescriptor();
        var idnull = charIDToTypeID( "null" );
            var ref16 = new ActionReference();
            var idlayerSection = stringIDToTypeID( "layerSection" );
            ref16.putClass( idlayerSection );
        desc286.putReference( idnull, ref16 );
        var idFrom = charIDToTypeID( "From" );
            var ref17 = new ActionReference();
            var idLyr = charIDToTypeID( "Lyr " );
            var idOrdn = charIDToTypeID( "Ordn" );
            var idTrgt = charIDToTypeID( "Trgt" );
            ref17.putEnumerated( idLyr, idOrdn, idTrgt );
        desc286.putReference( idFrom, ref17 );
        var idlayerSectionStart = stringIDToTypeID( "layerSectionStart" );
        desc286.putInteger( idlayerSectionStart, 55 );
        var idlayerSectionEnd = stringIDToTypeID( "layerSectionEnd" );
        desc286.putInteger( idlayerSectionEnd, 56 );
        var idNm = charIDToTypeID( "Nm  " );
        desc286.putString( idNm, """Group 1""" );
    executeAction( idMk, desc286, DialogModes.NO );


}

function moveAdjMask() {
    var idMk = charIDToTypeID( "Mk  " );
        var desc353 = new ActionDescriptor();
        var idNw = charIDToTypeID( "Nw  " );
        var idChnl = charIDToTypeID( "Chnl" );
        desc353.putClass( idNw, idChnl );
        var idAt = charIDToTypeID( "At  " );
            var ref58 = new ActionReference();
            var idChnl = charIDToTypeID( "Chnl" );
            var idChnl = charIDToTypeID( "Chnl" );
            var idMsk = charIDToTypeID( "Msk " );
            ref58.putEnumerated( idChnl, idChnl, idMsk );
            var idLyr = charIDToTypeID( "Lyr " );
            ref58.putName( idLyr, "Group 1" );
        desc353.putReference( idAt, ref58 );
        var idUsng = charIDToTypeID( "Usng" );
            var ref59 = new ActionReference();
            var idChnl = charIDToTypeID( "Chnl" );
            var idChnl = charIDToTypeID( "Chnl" );
            var idMsk = charIDToTypeID( "Msk " );
            ref59.putEnumerated( idChnl, idChnl, idMsk );
            var idLyr = charIDToTypeID( "Lyr " );
            ref59.putName( idLyr, "Adj" );
        desc353.putReference( idUsng, ref59 );
    executeAction( idMk, desc353, DialogModes.NO );
}

function createSolidColour() {
    var idMk = charIDToTypeID( "Mk  " );
        var desc318 = new ActionDescriptor();
        var idnull = charIDToTypeID( "null" );
            var ref35 = new ActionReference();
            var idcontentLayer = stringIDToTypeID( "contentLayer" );
            ref35.putClass( idcontentLayer );
        desc318.putReference( idnull, ref35 );
        var idUsng = charIDToTypeID( "Usng" );
            var desc319 = new ActionDescriptor();
            var idType = charIDToTypeID( "Type" );
                var desc320 = new ActionDescriptor();
                var idClr = charIDToTypeID( "Clr " );
                    var desc321 = new ActionDescriptor();
                    var idRd = charIDToTypeID( "Rd  " );
                    desc321.putDouble( idRd, 213.996735 );
                    var idGrn = charIDToTypeID( "Grn " );
                    desc321.putDouble( idGrn, 207.996826 );
                    var idBl = charIDToTypeID( "Bl  " );
                    desc321.putDouble( idBl, 197.996979 );
                var idRGBC = charIDToTypeID( "RGBC" );
                desc320.putObject( idClr, idRGBC, desc321 );
            var idsolidColorLayer = stringIDToTypeID( "solidColorLayer" );
            desc319.putObject( idType, idsolidColorLayer, desc320 );
        var idcontentLayer = stringIDToTypeID( "contentLayer" );
        desc318.putObject( idUsng, idcontentLayer, desc319 );
    executeAction( idMk, desc318, DialogModes.NO );

    var idmove = charIDToTypeID( "move" );
        var desc324 = new ActionDescriptor();
        var idnull = charIDToTypeID( "null" );
            var ref36 = new ActionReference();
            var idLyr = charIDToTypeID( "Lyr " );
            var idOrdn = charIDToTypeID( "Ordn" );
            var idTrgt = charIDToTypeID( "Trgt" );
            ref36.putEnumerated( idLyr, idOrdn, idTrgt );
        desc324.putReference( idnull, ref36 );
        var idT = charIDToTypeID( "T   " );
            var ref37 = new ActionReference();
            var idLyr = charIDToTypeID( "Lyr " );
            var idOrdn = charIDToTypeID( "Ordn" );
            var idBack = charIDToTypeID( "Back" );
            ref37.putEnumerated( idLyr, idOrdn, idBack );
        desc324.putReference( idT, ref37 );
    executeAction( idmove, desc324, DialogModes.NO );
}

function removeMask() {
    var idDlt = charIDToTypeID( "Dlt " );
        var desc361 = new ActionDescriptor();
        var idnull = charIDToTypeID( "null" );
            var ref64 = new ActionReference();
            var idChnl = charIDToTypeID( "Chnl" );
            var idChnl = charIDToTypeID( "Chnl" );
            var idMsk = charIDToTypeID( "Msk " );
            ref64.putEnumerated( idChnl, idChnl, idMsk );
        desc361.putReference( idnull, ref64 );
    executeAction( idDlt, desc361, DialogModes.NO );
}

function functionLayerColour(colour) {
	switch (colour.toLocaleLowerCase()) {
		case 'red': colour = 'Rd  '; break;
		case 'orange' : colour = 'Orng'; break;
		case 'yellow' : colour = 'Ylw '; break;
		case 'green' : colour = 'Grn '; break;
		case 'blue' : colour = 'Bl  '; break;
		case 'violet' : colour = 'Vlt '; break;
		case 'gray' : colour = 'Gry '; break;
		case 'grey' : colour = 'Gry '; break;
		case 'none' : colour = 'None'; break;
		default : colour = 'None'; break;
	}
	var desc = new ActionDescriptor();
		var ref = new ActionReference();
		ref.putEnumerated( charIDToTypeID('Lyr '), charIDToTypeID('Ordn'), charIDToTypeID('Trgt') );
	desc.putReference( charIDToTypeID('null'), ref );
		var desc2 = new ActionDescriptor();
		desc2.putEnumerated( charIDToTypeID('Clr '), charIDToTypeID('Clr '), charIDToTypeID(colour) );
	desc.putObject( charIDToTypeID('T   '), charIDToTypeID('Lyr '), desc2 );
	executeAction( charIDToTypeID('setd'), desc, DialogModes.NO );
}

function saveTxt(text, name, path, ext) {
    if (!ext) ext = ".txt";
    var saveFile = File(Folder(path) + "/" + name + ext);
    if (saveFile.exists) saveFile.remove();
    saveFile.encoding = "UTF8";
    saveFile.open("e", "TEXT", "????");
    saveFile.writeln(text);
    saveFile.close();
}