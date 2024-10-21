let scheduleData = {};
let teacherClasses = {};
let absentTeachers = [];
let availableTeachers = [];
let replacementTeachers = [];
let provisionalAssignments = {}; // Track which teacher is assigned at each time slot
let teacherClassCount = {}; // To track total classes (regular + provisional) for each teacher
let excludedClasses = []; // This should be set by your savePreferences function.

// Fetch the schedule data
function fetchScheduleData() {
  fetch("/final.json")
    .then((response) => response.json())
    .then((data) => {
      scheduleData = data.schedule;
      generateTeacherClasses();
      loadAvailableTeachers();
    })
    .catch((error) => console.error("Error fetching schedule data:", error));
}

// Generate the number of classes each teacher has
function generateTeacherClasses() {
  teacherClasses = {};
  Object.values(scheduleData).forEach((entries) => {
    entries.forEach((entry) => {
      if (!teacherClasses[entry.teacher]) {
        teacherClasses[entry.teacher] = 0;
      }
      teacherClasses[entry.teacher]++;
    });
  });
}

// Load available teachers
function loadAvailableTeachers() {
  availableTeachers = new Set();
  Object.values(scheduleData).forEach((entries) => {
    entries.forEach((entry) => {
      availableTeachers.add(entry.teacher);
    });
  });
  availableTeachers = Array.from(availableTeachers);
}
function savePreferences() {
  excludedClasses = []; // Reset excluded classes
  const checkboxes = document.querySelectorAll(".class-checkbox");

  checkboxes.forEach((checkbox) => {
    if (checkbox.checked) {
      excludedClasses.push(checkbox.value); // Add checked classes to the excludedClasses array
    }
  });

  // Optionally, close the modal or overlay
  document.getElementById("preferencesOverlay").style.display = "none"; // Hide the preferences overlay
}

window.onload = fetchScheduleData;

// Load the schedule for the selected day
function loadSchedule() {
  const day = document.getElementById("daySelect").value;

  if (day) {
    absentTeachers = [];
    document.getElementById("teacherSelectionSection").style.display = "block";

    if (scheduleData[day]) {
      populateTeacherList();

      // Show absent teachers as an alert after teacher list is populated
      setTimeout(() => {
        // alert(`Select Absent Teachers for ${day}. ${absentTeachers.join(', ')}`);
      }, 100);
    } else {
      document.getElementById("teacherList").innerHTML =
        "<p>No schedule available for the selected day</p>";
    }
  } else {
    document.getElementById("teacherSelectionSection").style.display = "none";
  }
}
// Function to count the number of classes a teacher has on a specific day
function countClassesForTeacher(teacher, day) {
  return scheduleData[day].filter((entry) => entry.teacher === teacher).length;
}

// Populate the teacher checkbox list
function populateTeacherList() {
  const teacherList = document.getElementById("teacherList");
  teacherList.innerHTML = ""; // Clear previous data

  if (availableTeachers.length > 0) {
    availableTeachers.forEach((teacher) => {
      const classCount = countClassesForTeacher(
        teacher,
        document.getElementById("daySelect").value
      );
      let checkbox = `<div>
        <input type="checkbox" id="teacher-${teacher}" value="${teacher}" onchange="updateAbsentTeachers()">
        <label for="teacher-${teacher}" style="padding-left:5px;">
          ${teacher} <strong style="color:Orange;">(${classCount})</strong>
        </label>
      </div>`;
      teacherList.innerHTML += checkbox;
    });
  } else {
    teacherList.innerHTML = "<p>No teachers available</p>";
  }
}

// Update the list of absent teachers based on selected checkboxes
function updateAbsentTeachers() {
  absentTeachers = Array.from(
    document.querySelectorAll("#teacherList input:checked")
  ).map((input) => input.value);
}

// Helper function to count consecutive classes for a teacher
function countConsecutiveClasses(teacher, day) {
  let teacherClasses = scheduleData[day].filter(
    (entry) => entry.teacher === teacher
  );
  let timeSlots = teacherClasses.map((entry) => entry.timeSlot).sort(); // Sort by time slots
  let consecutiveCount = 0;
  let maxConsecutive = 0;

  // Count consecutive time slots
  for (let i = 1; i < timeSlots.length; i++) {
    if (timeSlots[i] === timeSlots[i - 1] + 1) {
      consecutiveCount++;
    } else {
      maxConsecutive = Math.max(maxConsecutive, consecutiveCount);
      consecutiveCount = 0; // Reset if not consecutive
    }
  }
  return Math.max(maxConsecutive, consecutiveCount); // Return the highest consecutive count
}

// Generate provisional routine based on available teachers
// Helper function to count consecutive classes for a teacher
function countConsecutiveClasses(teacher, day) {
  let teacherClasses = scheduleData[day].filter(
    (entry) => entry.teacher === teacher
  );
  let timeSlots = teacherClasses.map((entry) => entry.timeSlot).sort(); // Sort by time slots
  let consecutiveCount = 0;
  let maxConsecutive = 0;

  // Count consecutive time slots
  for (let i = 1; i < timeSlots.length; i++) {
    if (timeSlots[i] === timeSlots[i - 1] + 1) {
      consecutiveCount++;
    } else {
      maxConsecutive = Math.max(maxConsecutive, consecutiveCount);
      consecutiveCount = 0; // Reset if not consecutive
    }
  }
  return Math.max(maxConsecutive, consecutiveCount); // Return the highest consecutive count
}
// Open the modal
document.getElementById("preferencesButton").onclick = function () {
  document.getElementById("preferencesModal").style.display = "block";
};

// Close the modal
document.querySelector(".close").onclick = function () {
  document.getElementById("preferencesModal").style.display = "none";
};

function generateProvisionalRoutine() {
  document.getElementById("loader-overlay").style.display = "flex";
  setTimeout(() => {
    document.getElementById("loader-overlay").style.display = "none";
  }, 5000);

  const day = document.getElementById("daySelect").value;
  const provisionalTable = document.getElementById("provisionalTable");
  provisionalTable.innerHTML = "";

  if (day && scheduleData[day]) {
    // Get excluded classes based on checked checkboxes
    let excludedClasses = Array.from(
      document.querySelectorAll('input[type="checkbox"]:checked')
    ).map((checkbox) => checkbox.nextSibling.textContent.trim());

    // Track allocated teachers
    let allocatedTeachers = new Set();

    // Generate the provisional routine for absent teachers
    scheduleData[day].forEach((entry, index) => {
      const classLevel = entry.class;

      // Check if the class is excluded
      if (excludedClasses.includes(classLevel)) {
        // If class is excluded, show a "No period for this class" message only once for each class level
        if (index === 0 || entry.class !== scheduleData[day][index - 1].class) {
          let row = `<tr>
            <td colspan="5">No period for ${classLevel}</td>
          </tr>`;
          provisionalTable.innerHTML += row;
        }
        return; // Skip excluded classes
      }

      if (absentTeachers.includes(entry.teacher)) {
        const absentTeacherSubject = entry.subject;
        const timeSlot = entry.timeSlot;

        // Helper function to get consecutive classes
        function getConsecutiveClasses(entries, index) {
          const classLevel = entries[index].class;
          const section = entries[index].section;
          let consecutiveClasses = [entries[index]];

          // Check if next classes are consecutive
          for (let i = index + 1; i < entries.length; i++) {
            if (
              entries[i].class === classLevel &&
              entries[i].section === section
            ) {
              if (entries[i].timeSlot === entries[i - 1].timeSlot + 1) {
                consecutiveClasses.push(entries[i]);
              } else {
                break;
              }
            }
          }
          return consecutiveClasses;
        }

        // Get all consecutive classes for the absent teacher
        const consecutiveClasses = getConsecutiveClasses(
          scheduleData[day],
          index
        );
        let subjectTeachers = availableTeachers.filter((teacher) => {
          const isSameSubject = scheduleData[day].some(
            (e) => e.teacher === teacher && e.subject === absentTeacherSubject
          );
          const isFreeAtTimeSlot = !scheduleData[day].some(
            (e) => e.teacher === teacher && e.timeSlot === timeSlot
          );
          return isSameSubject && isFreeAtTimeSlot;
        });

        if (classLevel === "Grade 11" || classLevel === "Grade 12") {
          // If no same-subject teacher is available for Grade 11/12, mark as Off Period
          if (subjectTeachers.length === 0) {
            consecutiveClasses.forEach((classEntry) => {
              let row = `<tr>
                <td>${classEntry.class}</td>
                <td>${classEntry.section}</td>
                <td>${classEntry.teacher}</td>
                <td>Off Period</td>
                <td>${classEntry.timeSlot}</td>
              </tr>`;
              provisionalTable.innerHTML += row;
            });
            return; // Skip to the next iteration
          }
        }

        // Check if all consecutive classes can be allocated to a single teacher
        let fullAllocationPossible = subjectTeachers.some((teacher) => {
          return consecutiveClasses.every((classEntry) => {
            return !scheduleData[day].some(
              (e) => e.teacher === teacher && e.timeSlot === classEntry.timeSlot
            );
          });
        });

        if (fullAllocationPossible) {
          // Allocate one teacher for all consecutive classes
          let replacementTeacher = subjectTeachers.shift();

          // Check if the replacementTeacher has already been allocated
          if (!allocatedTeachers.has(replacementTeacher)) {
            consecutiveClasses.forEach((classEntry) => {
              allocatedTeachers.add(replacementTeacher); // Mark as allocated
              let row = `<tr>
                <td>${classEntry.class}</td>
                <td>${classEntry.section}</td>
                <td>${classEntry.teacher}</td>
                <td>${replacementTeacher || "N/A"}</td>
                <td>${classEntry.timeSlot}</td>
              </tr>`;
              provisionalTable.innerHTML += row;
            });
          }
        } else {
          // Allocate partially or mark as Off Period for Grade 11/12
          consecutiveClasses.forEach((classEntry, i) => {
            let replacementTeacher = subjectTeachers.find((teacher) => {
              return (
                !allocatedTeachers.has(teacher) && // Check if not allocated
                !scheduleData[day].some(
                  (e) =>
                    e.teacher === teacher && e.timeSlot === classEntry.timeSlot
                )
              );
            });

            if (replacementTeacher && i === 0) {
              allocatedTeachers.add(replacementTeacher); // Mark as allocated
              let row = `<tr>
                <td>${classEntry.class}</td>
                <td>${classEntry.section}</td>
                <td>${classEntry.subject}</td>
                <td>${classEntry.teacher}</td>
                <td>${replacementTeacher}</td>
                <td>${classEntry.timeSlot}</td>
              </tr>`;
              provisionalTable.innerHTML += row;
            } else if (classLevel === "Grade 11" || classLevel === "Grade 12") {
              // Mark as "Off Period" for the rest of consecutive classes in Grade 11/12
              let row = `<tr>
                <td>${classEntry.class}</td>
                <td>${classEntry.section}</td>
                <td>${classEntry.subject}</td>
                <td>${classEntry.teacher}</td>
                <td>Off Period</td>
                <td>${classEntry.timeSlot}</td>
              </tr>`;
              provisionalTable.innerHTML += row;
            }
          });
        }
      }
    });

    document.getElementById("provisionalRoutineSection").style.display =
      "block";
  } else {
    document.getElementById("provisionalRoutineSection").style.display = "none";
  }
}
