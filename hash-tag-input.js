(function($) {


    $.fn.hashTagInput = function(options) {

        if (this.length > 1){
            this.each(function() { $(this).hashTagInput(options) });
            return this;
        }

        var settings = $.extend({
            showHashTags: true,
            hideInput: true,
            formatAsBubbles: true,
            wrapTags: true,
            onTagAdded: null,
            onTagSearch: null
        }, options );


        var tagStringToArray = function(tagString){
            //clean before splitting
            tagString = tagString.trim();
            tagString = tagString.replace(/\s/g, ';');
            tagString = tagString.replace(/&nbsp;&nbsp;/g, ";");
            tagString = tagString.replace(/&nbsp;/g, ";");


            tagString = tagString.replace(/#/g, "");

            return tagString.split(';');
        }

        var formatTags = function(tags, asBubbles, editableFrom){

            for(var i = 0; i < tags.length; i++){
                if(tags[i].trim() == '' || tags[i].trim() == '#'){
                    tags.splice(i, 1);
                }
            }


            if(settings.showHashTags){
                for(var i = 0; i < tags.length; i++){
                    if(tags[i].charAt(0) != '#'){
                        tags[i] = '#' + tags[i];
                    }
                }
            }


            for(var i = 0; i < tags.length; i++){
                if(asBubbles && settings.formatAsBubbles){
                    tags[i] = "<span class='bubble-hash-tag'>" + tags[i] + "</span>";
                }else if(settings.wrapTags){
                    if(editableFrom != -1 && editableFrom <= i){
                        tags[i] = "<span class='hash-tag editing'>" + tags[i] + "</span>";
                    }else{
                        tags[i] = "<span class='hash-tag'>" + tags[i] + "</span>";
                    }

                }

            }


            return tags;
        }

        var tagsToInputString = function(tags){

            var inputString = tags.join();

            //replace commas with spaces
            inputString = inputString.replace(/,/g, " ");

            return inputString += '&nbsp;';
        }

        var tagsToOutputList = function(div, inputElement){

            var tags = tagStringToArray($(div).text());

            $(inputElement).val(tags.join(','));

            console.log($(inputElement).val());
        }

        var enterInputFormatting = function(div, editableFrom){
            var tags = tagStringToArray($(div).text());
            var formattedTags = formatTags(tags, false, editableFrom);

            $(div).html(tagsToInputString(formattedTags));
        }

        var leaveInputFormatting = function(div){
            var tags = tagStringToArray($(div).text());
            console.log(tags);
            var formattedTags = formatTags(tags, true, -1);

            $(div).html(tagsToInputString(formattedTags));

            $('.bubble-hash-tag').unbind('click');
            $('.bubble-hash-tag').click(function(){

                var posInTags = $(this).parent().children().index(this);

                enterInputFormatting(div, posInTags);

                var newPos = $(div).text().indexOf($(this).text()) + $(this).text().length;
                setCursorSelectionRange(div, newPos, newPos);
                inEditMode = true;
            });

            //trigger callback
            if(typeof settings.onTagSearch == 'function'){
                settings.onTagSearch.call(div);
            }
        }

        var addEventListenersToInputDiv = function(div, inputElement){

            $(div).unbind('keydown');
            $(div).keydown(function(e){
                //need to do this on keydown so deleted characters still exist
                var code = e.which;
                if(code == 8){
                    //backspace pressed
                    //okay so need to check if they are backspacing over a space
                    var currentText = $(this).text();
                    var caretPosition = getCaretCharacterOffsetWithin(this);
                    var deletedCharacter = currentText.charAt(caretPosition - 1)
                    if(deletedCharacter.trim() == ''){
                        //then find last tag and add editing class
                        //need to find word of tag before caret
                        var currentTagWord = getWordAt(currentText, currentText.length - 2);

                        //find tag element that contains that word
                        var tagElement = getElementFromTagName(currentTagWord);

                        //find its position in all tags
                        var posInTags = $(tagElement).parent().children().index(tagElement);

                        //format the tags
                        enterInputFormatting(div, posInTags);
                        inEditMode = true;
                    }
                }

            });

            $(div).unbind('keyup');
            $(div).keyup(function(e){
                var code = e.which;


                if(code == 32){
                    //space bar is pressed
                    enterInputFormatting(this, -1);
                    moveCursorToEndOfInput(this);
                }else if(code == 13){
                    leaveInputFormatting(this);
                    tagsToOutputList(this, inputElement);
                    $(this).blur();
                    e.stopPropagation();
                }else if(code == 8){
                    //backspace pressed

                }
            });

            $(div).click(function(e){
                if(!inEditMode){
                    enterInputFormatting(this, -1);
                    moveCursorToEndOfInput(this);
                    inEditMode = true;
                }
            });

            $(div).focusout(function(e){
                leaveInputFormatting(this);
                tagsToOutputList(this, inputElement);
                inEditMode = false;
            });


        }

        var getElementFromTagName = function(tagName){
            return $('.hash-tag:contains("' + tagName + '")');
        }

        var getWordAt = function(str, pos) {
            // Perform type conversions.
            str = String(str);
            pos = Number(pos) >>> 0;

            // Search for the word's beginning and end.
            var left = str.slice(0, pos + 1).search(/\S+$/),
                right = str.slice(pos).search(/\s/);

            // The last word in the string is a special case.
            if (right < 0) {
                return str.slice(left);
            }

            // Return the word, using the located bounds to extract it from the string.
            return str.slice(left, right + pos);

        }

        var getCaretCharacterOffsetWithin = function(element){
            var caretOffset = 0;
            var doc = element.ownerDocument || element.document;
            var win = doc.defaultView || doc.parentWindow;
            var sel;
            if (typeof win.getSelection != "undefined") {
                sel = win.getSelection();
                if (sel.rangeCount > 0) {
                    var range = win.getSelection().getRangeAt(0);
                    var preCaretRange = range.cloneRange();
                    preCaretRange.selectNodeContents(element);
                    preCaretRange.setEnd(range.endContainer, range.endOffset);
                    caretOffset = preCaretRange.toString().length;
                }
            } else if ( (sel = doc.selection) && sel.type != "Control") {
                var textRange = sel.createRange();
                var preCaretTextRange = doc.body.createTextRange();
                preCaretTextRange.moveToElementText(element);
                preCaretTextRange.setEndPoint("EndToEnd", textRange);
                caretOffset = preCaretTextRange.text.length;
            }
            return caretOffset;
        }


        //see http://stackoverflow.com/questions/6240139/highlight-text-range-using-javascript/6242538#6242538 for more info on next two functions
        var getTextNodesIn = function(node) {
            var textNodes = [];
            if (node.nodeType == 3) {
                textNodes.push(node);
            } else {
                var children = node.childNodes;
                for (var i = 0, len = children.length; i < len; ++i) {
                    textNodes.push.apply(textNodes, getTextNodesIn(children[i]));
                }
            }
            return textNodes;
        }

        var setCursorSelectionRange = function(el, start, end) {
            if (document.createRange && window.getSelection) {
                var range = document.createRange();
                range.selectNodeContents(el);
                var textNodes = getTextNodesIn(el);
                var foundStart = false;
                var charCount = 0, endCharCount;

                for (var i = 0, textNode; textNode = textNodes[i++]; ) {
                    endCharCount = charCount + textNode.length;
                    if (!foundStart && start >= charCount
                        && (start < endCharCount ||
                        (start == endCharCount && i < textNodes.length))) {
                        range.setStart(textNode, start - charCount);
                        foundStart = true;
                    }
                    if (foundStart && end <= endCharCount) {
                        range.setEnd(textNode, end - charCount);
                        break;
                    }
                    charCount = endCharCount;
                }

                var sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            } else if (document.selection && document.body.createTextRange) {
                var textRange = document.body.createTextRange();
                textRange.moveToElementText(el);
                textRange.collapse(true);
                textRange.moveEnd("character", end);
                textRange.moveStart("character", start);
                textRange.select();
            }
        }

        var moveCursorToEndOfInput = function(contentEditableElement){

            var range,selection;
            if(document.createRange)//Firefox, Chrome, Opera, Safari, IE 9+
            {
                range = document.createRange();//Create a range (a range is a like the selection but invisible)
                range.selectNodeContents(contentEditableElement);//Select the entire contents of the element with the range
                range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
                selection = window.getSelection();//get the selection object (allows you to change selection)
                selection.removeAllRanges();//remove any selections already made
                selection.addRange(range);//make the range you have just created the visible selection
            }
            else if(document.selection)//IE 8 and lower
            {
                range = document.body.createTextRange();//Create a range (a range is a like the selection but invisible)
                range.moveToElementText(contentEditableElement);//Select the entire contents of the element with the range
                range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
                range.select();//Select the range (make it the visible selection
            }
        }


        var hashTagInputCount = 1;
        var inEditMode = false;
        var thisInput;

        this.initialize = function(){

            if(settings.hideInput){
                $(this).hide();
            }

            var markup = "<div contenteditable='true' class='hash-tag-input' id='hash-tag-input-" + hashTagInputCount + "'></div>";
            $(markup).insertAfter(this);

            thisInput  = $("#hash-tag-input-" + hashTagInputCount);


            addEventListenersToInputDiv(thisInput, this);

            hashTagInputCount++;



            return this;
        }


        //public function methods
        this.getTags = function(asArray){
            if(asArray){
                return tagStringToArray($(thisInput).text());
            }else{
                return tagStringToArray($(thisInput).text()).join(',');
            }
        }

        this.addTag = function(tag){
            if(tag){

                if(settings.showHashTags && tag.charAt(0) != '#'){
                    tag = '#' + tag;
                }

                var tags = tagStringToArray($(thisInput).text());
                tags.push(tag);
                var formattedTags = formatTags(tags, false, -1);

                $(thisInput).html(tagsToInputString(formattedTags));


                return true;
            }else{
               return false;
            }
        }

        //Methods needed TODO
        this.removeTag = function(tag){
        }

        this.tagExists = function(tag){
        }

        this.setToEditMode = function(){
        }

        this.setToBubbleMode = function(){
        }

        return this.initialize();
    };

}(jQuery));