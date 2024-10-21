
      async function fetchSchedule() {
        try {
          // Fetch the schedule JSON file
          const response = await fetch('/final.json');
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          const schedule = await response.json();

          // Function to create and display the table
          function displaySchedule(day) {
            const container = document.getElementById('schedule-container');
            let tableHtml = '<h2 style="font-sixe:20px;font-weight:400px;">Regular Schedule</h2>'; // Add heading

            tableHtml += '<table>';

            // Create table headers
            tableHtml += '<thead><tr><th>Day</th><th>Class</th><th>Section</th><th>Subject</th><th>Teacher</th><th>Time Slot</th></tr></thead><tbody>';

            // Display schedule for the selected day
            if (schedule.schedule[day]) {
              schedule.schedule[day].forEach(entry => {
                tableHtml += `<tr><td>${day}</td><td>${entry.class}</td><td>${entry.section}</td><td>${entry.subject}</td><td>${entry.teacher}</td><td>${entry.timeSlot}</td></tr>`;
              });
            } else {
              tableHtml += '<tr><td colspan="6">No schedule available for the selected day</td></tr>';
            }

            tableHtml += '</tbody></table>';
            container.innerHTML = tableHtml;
          }


          // Load schedule for the selected day
          document.getElementById('daySelect').addEventListener('change', function () {
            const selectedDay = this.value;
            displaySchedule(selectedDay);
          });

          // Initial display based on the default selected day
          const initialDay = document.getElementById('daySelect').value;
          if (initialDay) {
            displaySchedule(initialDay);
          }

        } catch (error) {
          console.error('Error fetching schedule:', error);
        }
      }

      // Fetch and display the schedule on page load
      fetchSchedule();
