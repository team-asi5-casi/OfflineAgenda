var agendapp = {

	init: function () {
		this.model.init();
		this.view.init();
		this.controller.init();
	},

	model: {

		init: 	function() {
             var SERVER_INTERFACE_URL = "agendapp/eventInterface.php";
            var RELATIVE_SERVER_INTERFACE_URL = "../server/eventInterface.php";
            /**
             * Creates a new calendar event instance.
             * @constructor
             */
             function CalendarEvent(name, beginDate, endDate) {
                // properties
                this.name = name;
                this.beginDate = beginDate;
                this.endDate = endDate;
            }
            
            /**
             * Creates a new calendar event instance.
             * @constructor
             */
             function CalendarEvent(name, beginDate) {
                // properties
                this.name = name;
                this.beginDate = beginDate;
            }
            
            // Methods for CalendarEvent prototype
            // displayAll est un test, il faudra la virer
            CalendarEvent.prototype.displayAll = function() {
            	return this.name + " " + this.beginDate + " " + this.endDate;
            };
            
            /**
             * Save the current CalendarEvent to server database
             */
            CalendarEvent.prototype.save_to_server = function() {
                var request_data = new Object();
                request_data.query = "save";
                request_data.event = this;
                $.getJSON(RELATIVE_SERVER_INTERFACE_URL);
                console.log('avant save to server');
                $.getJSON(RELATIVE_SERVER_INTERFACE_URL, request_data, function (result) {
                    if (result.error == 'KO') {
                        console.log('An error occured while saving event in server. Détails : '.result.message);
                    }
                    else if(result.error == 'OK'){
                        console.log('Event saved to server.');
                    }
                    else{
                        console.log('Unexpected error with server. '.result);
                    }
                });
                console.log('fin save to server');
            }
            // export to agendapp the prototype
            agendapp.model.CalendarEvent = CalendarEvent;
        },


        fetchEvents: function (start, end, timezone, callback) {
			// TEST à virer
			var event1 = new agendapp.model.CalendarEvent('jaune1', '2015-01-02');
			var event2 = new agendapp.model.CalendarEvent('jaune2', '2015-01-05', '2015-01-08');
            // Must return an array of Event Objects via the callback function (See http://fullcalendar.io/docs/event_data/Event_Object/)
            var events = [
            {
            	id: 1822,
            	title: 'All Day Event',
            	start: '2014-11-01'
            },
            {
            	id: 1829,
            	title: 'Long Event',
            	start: '2014-11-07',
            	end: '2014-11-10'
            },
            {
            	id: 1898,
            	title: event1.name,
            	start: event1.beginDate,
            	end: '2015-01-02'
            },
            {
            	id: 1827,
            	title: event2.name,
            	start: event2.beginDate,
            	end: event2.endDate
            }
            ];
            callback(events);
        },
        
    },

    view: {
    	init: 	function() {
    		/*** Creating calendar ***/
			// See http://fullcalendar.io/docs/ for more informations.
			$('#agenda').fullCalendar({
				/*** Display settings ***/
				header: {
					left: 'prev,next today',
					center: 'title',
					right: 'month,agendaWeek,agendaDay'
				},
				defaultDate: '2015-01-05',
				/*** Behavior settings ***/
				selectable: true,
				selectHelper: true,
				editable: true,
				eventLimit: true,
				/*** Data settings ***/
				events: agendapp.model.fetchEvents,
				/*** UI-Event listeners ***/
				select: agendapp.view.showAddEventForm, // Day-Selection event
				eventClick: agendapp.view.showEditEventForm, // Event-Selection event
				eventDragStop: agendapp.view.showRemoveEventForm, // Event-drag-stop event
				eventDrop: agendapp.controller.dropEvent, // Event-drop event
				eventResize: agendapp.controller.resizeEvent // Event-Resize event
			});
			$('#trash').droppable({
				tolerance: "pointer",
				over: function(event, ui) { // handlerIn
					console.log('Over !');
					$('#trash').attr('src','res/open-trash.png');
				},
				out: function(event, ui) { // handlerOut
					console.log('Out !');
					$('#trash').attr('src','res/trash.png');
				}
			});
		},
		showAddEventForm: function(start, end) {
			$('#add-event-form #start').val(start.format()); // Filling start date form field
			$('#add-event-form #end').val(end.format()); // Filling end date form field
			$.blockUI({ 
				message: $('#add-event-popup') ,
				onOverlayClick: $.unblockUI
			}); // Showing the previously filled pop-up
		},
		showEditEventForm: function(calEvent) {
			$('#edit-event-form #title').val(calEvent.title); // Filling title form field
			$('#edit-event-form').attr('event-id',calEvent.id); // Setting the event-id attribute
			$.blockUI({ 
				message: $('#edit-event-popup'),
				onOverlayClick: $.unblockUI
			}); // Showing the previously filled pop-up
		},
		showRemoveEventForm: function(calEvent, jsEvent) {
			var trash = $('#trash');
			var ofs = trash.offset();
			var x1 = ofs.left;
			var x2 = ofs.left + trash.outerWidth(true);
			var y1 = ofs.top;
			var y2 = ofs.top + trash.outerHeight(true);

			if (jsEvent.pageX >= x1 && jsEvent.pageX<= x2 && 
				jsEvent.pageY >= y1 && jsEvent.pageY <= y2) { // If the event was dropped on the trash can area
				$('#remove-event-form #title').html(calEvent.title); // Filling title span
				$('#remove-event-form').attr('event-id',calEvent.id); // Setting the event-id attribute
				$.blockUI({ 
					message: $('#remove-event-popup'),
					onOverlayClick: $.unblockUI
				}); // Showing the previously filled pop-up
			}
		}
	},

	controller: {
		init: function() {
			/*** Form submition listeners ***/
			$('#add-event-form').submit(this.addEvent);
			$('#edit-event-form').submit(this.editEvent);
			$('#remove-event-form').submit(this.removeEvent);
		},
		addEvent: function(jsEvent) {
			if ($('#add-event-form #title').val()) {
				var eventData = {
					title: $('#add-event-form #title').val(),
					start: $('#add-event-form #start').val(),
					end: $('#add-event-form #end').val()
				};
				console.log(eventData);
				$('#agenda').fullCalendar('renderEvent', eventData, true); // Add the event to the calendar
				//TODO: Enregistrer en BD et update le rendering à la place de la ligne du dessus
			}
			$.unblockUI(); // Remove the pop-up
			jsEvent.preventDefault(); // Avoïd the page to be reloaded
		},
		dropEvent: function(calEvent, delta, revertFunc) {
			console.log(calEvent.title + " was dropped on " + calEvent.start.format());
			//TODO: Enregistrer en BD
		},
		resizeEvent: function(calEvent, delta, revertFunc) {
			console.log(calEvent.title + " was resized to " + calEvent.end.format());
			//TODO: Enregistrer en BD
		},
		editEvent: function(jsEvent) {
			var editedEvents = $('#agenda').fullCalendar('clientEvents',$('#edit-event-form').attr('event-id'));
			console.log(editedEvents[0].title + "was renamed " + $('#edit-event-form #title').val());
			for (var i = editedEvents.length - 1; i >= 0; i--) {
				editedEvents[i].title = $('#edit-event-form #title').val();
				$('#agenda').fullCalendar('updateEvent', editedEvents[i]);
			};
			//TODO: Enregistrer en BD
			$.unblockUI(); // Remove the pop-up
			jsEvent.preventDefault();
		},
		removeEvent: function(jsEvent) {
			console.log($('#remove-event-form #title').html() + " was removed (id: " + $('#remove-event-form').attr('event-id') + ")");
			$('#agenda').fullCalendar('removeEvents', $('#remove-event-form').attr('event-id'));
			//TODO: Enregistrer en BD
			$.unblockUI(); // Remove the pop-up
			jsEvent.preventDefault();
		},
	},

};

$(document).ready(function() {
	agendapp.init();
});