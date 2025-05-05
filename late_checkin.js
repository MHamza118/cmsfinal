// Late Check-in and Check-out Module
// This module handles late check-ins and check-outs separately from the regular system

// Initialize Firebase references
const lateCheckInRef = firebase.database().ref("lateCheckInRecords");

// Function to open the late check-in modal
function openLateCheckInModal() {
    const now = new Date();

    // Use standard 24-hour format (HH:MM:SS) for consistency with the main system
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const currentTime = `${hours}:${minutes}:${seconds}`;

    // Set current time as default
    document.getElementById("lateCheckInTime").value = currentTime;

    // Show the modal
    document.getElementById("lateCheckInModal").style.display = "block";
    document.getElementById("modalOverlay").style.display = "block";
}

// Function to close the late check-in modal
function closeLateCheckInModal() {
    document.getElementById("lateCheckInModal").style.display = "none";
    document.getElementById("modalOverlay").style.display = "none";

    // Clear form fields
    document.getElementById("lateCheckInReason").value = "";
}

// Function to handle late check-in submission
function submitLateCheckIn() {
    const now = new Date();
    const employee = document.getElementById("employeeDetails").textContent.split("|")[0].trim();

    // Use standardized date format
    const date = standardizeDate(now);
    const day = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][now.getDay()];

    // Get values from form
    let lateCheckInTime = document.getElementById("lateCheckInTime").value;
    const lateCheckInReason = document.getElementById("lateCheckInReason").value;

    if (!lateCheckInReason) {
        alert("Please provide a reason for your late check-in.");
        return;
    }

    // Standardize the time format to ensure consistency
    const standardizedTime = standardizeTimeFormat(lateCheckInTime);
    if (!standardizedTime) {
        alert("Invalid time format. Please enter a valid time.");
        return;
    }

    lateCheckInTime = standardizedTime;

    // Create late check-in record
    const lateCheckInRecord = {
        employee: employee,
        date: date,
        day: day,
        checkInTime: lateCheckInTime,
        reason: lateCheckInReason,
        status: "pending", // Admin needs to approve late check-ins
        timestamp: new Date().toISOString()
    };

    // Get existing late check-in records
    lateCheckInRef.once('value', (snapshot) => {
        let lateCheckInRecords = snapshot.val() || [];

        // Add new record
        lateCheckInRecords.push(lateCheckInRecord);

        // Save to Firebase
        lateCheckInRef.set(lateCheckInRecords)
            .then(() => {
                alert("Late check-in recorded successfully. Your late check-in is pending approval.");
                closeLateCheckInModal();
                loadLateCheckInTable();
            })
            .catch((error) => {
                console.error("Error saving late check-in record:", error);
                alert("Error recording late check-in. Please try again.");
            });
    });
}

// Function to handle late check-out
function handleLateCheckOut() {
    const now = new Date();
    const employee = document.getElementById("employeeDetails").textContent.split("|")[0].trim();

    // Use standardized date format
    const date = standardizeDate(now);

    // Use standard 24-hour format (HH:MM:SS) for consistency with the main system
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const time = `${hours}:${minutes}:${seconds}`;

    // Get existing late check-in records
    lateCheckInRef.once('value', (snapshot) => {
        let lateCheckInRecords = snapshot.val() || [];

        // Find the latest late check-in record for this employee and date without a check-out time
        const recordIndex = lateCheckInRecords.findIndex(
            record => record.employee === employee &&
                record.date === date &&
                !record.checkOutTime
        );

        if (recordIndex === -1) {
            alert("No late check-in found for today. Please use late check-in first.");
            return;
        }

        // Update the record with check-out time
        lateCheckInRecords[recordIndex].checkOutTime = time;

        // Calculate working hours
        const checkInTime = lateCheckInRecords[recordIndex].checkInTime;
        const workingHours = calculateLateWorkingHours(checkInTime, time);
        lateCheckInRecords[recordIndex].workingHours = workingHours;

        // Save to Firebase
        lateCheckInRef.set(lateCheckInRecords)
            .then(() => {
                alert("Late check-out recorded successfully. Your late check-out time: " + time);
                loadLateCheckInTable();
            })
            .catch((error) => {
                console.error("Error saving late check-out record:", error);
                alert("Error recording late check-out. Please try again.");
            });
    });
}

// Function to calculate working hours for late check-ins
function calculateLateWorkingHours(checkInTime, checkOutTime) {
    if (!checkInTime || !checkOutTime) return "-";

    // Standardize time format to ensure consistent parsing
    const standardizedCheckInTime = standardizeTimeFormat(checkInTime);
    const standardizedCheckOutTime = standardizeTimeFormat(checkOutTime);

    if (!standardizedCheckInTime || !standardizedCheckOutTime) {
        console.error("Invalid time format:", checkInTime, checkOutTime);
        return "-";
    }

    const checkIn = new Date(`1970-01-01T${standardizedCheckInTime}`);
    const checkOut = new Date(`1970-01-01T${standardizedCheckOutTime}`);

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
        console.error("Invalid date objects:", checkIn, checkOut);
        return "-";
    }

    // Calculate difference in milliseconds
    let diff = checkOut - checkIn;

    // If check-out is earlier than check-in, assume it's the next day
    if (diff < 0) {
        diff += 24 * 60 * 60 * 1000;
    }

    // Convert to hours and minutes
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
}

// Helper function to standardize time format to HH:MM:SS
function standardizeTimeFormat(timeStr) {
    if (!timeStr) return null;

    try {
        // Handle different time formats

        // If already in HH:MM:SS format
        if (/^\d{1,2}:\d{2}:\d{2}$/.test(timeStr)) {
            return timeStr.length === 8 ? timeStr : `0${timeStr}`;
        }

        // If in HH:MM format
        if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
            return timeStr.length === 5 ? `${timeStr}:00` : `0${timeStr}:00`;
        }

        // If in AM/PM format
        if (/\d{1,2}:\d{2}(:\d{2})?\s*(AM|PM|am|pm)/i.test(timeStr)) {
            const isPM = /pm/i.test(timeStr);
            const timeParts = timeStr.replace(/\s*(AM|PM|am|pm)/i, '').split(':');

            let hours = parseInt(timeParts[0], 10);
            const minutes = parseInt(timeParts[1], 10);
            const seconds = timeParts.length > 2 ? parseInt(timeParts[2], 10) : 0;

            // Convert to 24-hour format
            if (isPM && hours < 12) hours += 12;
            if (!isPM && hours === 12) hours = 0;

            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }

        // Try to parse using Date object as fallback
        const now = new Date();
        const testDate = new Date(`${now.toDateString()} ${timeStr}`);

        if (!isNaN(testDate.getTime())) {
            return `${testDate.getHours().toString().padStart(2, '0')}:${testDate.getMinutes().toString().padStart(2, '0')}:${testDate.getSeconds().toString().padStart(2, '0')}`;
        }

        console.error("Unrecognized time format:", timeStr);
        return null;
    } catch (e) {
        console.error("Error standardizing time format:", e);
        return null;
    }
}

// Function to load late check-in records for the employee
function loadLateCheckInTable() {
    const employee = document.getElementById("employeeDetails").textContent.split("|")[0].trim();

    // Get late check-in records
    lateCheckInRef.once('value', (snapshot) => {
        const lateCheckInRecords = snapshot.val() || [];

        // Filter records for current employee
        const employeeRecords = lateCheckInRecords.filter(record => record.employee === employee);

        // Sort records by date in descending order (newest first)
        employeeRecords.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        const tableBody = document.getElementById("lateCheckInTable");
        if (!tableBody) return;

        tableBody.innerHTML = "";

        if (employeeRecords.length === 0) {
            const row = document.createElement("tr");
            row.innerHTML = '<td colspan="7" style="text-align: center;">No late check-in records found</td>';
            tableBody.appendChild(row);
            return;
        }

        // Add records to table
        employeeRecords.forEach(record => {
            const row = document.createElement("tr");

            // Format check-out time display
            const checkOutDisplay = record.checkOutTime || "-";

            // Format working hours display
            const workingHoursDisplay = record.workingHours || "-";

            // Format status display
            let statusDisplay = "";
            switch (record.status) {
                case "approved":
                    statusDisplay = '<span class="status-approved">Approved</span>';
                    break;
                case "rejected":
                    statusDisplay = '<span class="status-rejected">Rejected</span>';
                    break;
                default:
                    statusDisplay = '<span class="status-pending">Pending</span>';
            }

            row.innerHTML = `
                <td>${record.date}</td>
                <td>${record.day}</td>
                <td>${record.checkInTime}</td>
                <td>${checkOutDisplay}</td>
                <td>${record.reason}</td>
                <td>${workingHoursDisplay}</td>
                <td>${statusDisplay}</td>
            `;

            tableBody.appendChild(row);
        });
    });
}

// Function to load late check-in records for admin view
function loadAdminLateCheckInRecords(selectedUser = "") {
    // Get late check-in records
    lateCheckInRef.once('value', (snapshot) => {
        const lateCheckInRecords = snapshot.val() || [];

        // Filter records for selected user if specified
        const filteredRecords = selectedUser
            ? lateCheckInRecords.filter(record => record.employee === selectedUser)
            : lateCheckInRecords;

        // Sort records by date in descending order (newest first)
        filteredRecords.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        const tableBody = document.getElementById("adminLateCheckInTable");
        if (!tableBody) return;

        tableBody.innerHTML = "";

        if (filteredRecords.length === 0) {
            const row = document.createElement("tr");
            row.innerHTML = '<td colspan="8" style="text-align: center;">No late check-in records found</td>';
            tableBody.appendChild(row);
            return;
        }

        // Add records to table
        filteredRecords.forEach((record, index) => {
            // Find the actual index of this record in the original array
            const actualIndex = lateCheckInRecords.findIndex(r =>
                r.employee === record.employee &&
                r.date === record.date &&
                r.checkInTime === record.checkInTime &&
                r.timestamp === record.timestamp
            );

            const row = document.createElement("tr");

            // Format check-out time display
            const checkOutDisplay = record.checkOutTime || "-";

            // Format working hours display
            const workingHoursDisplay = record.workingHours || "-";

            // Format status display and action buttons
            let statusDisplay = "";
            let actionButtons = "";

            switch (record.status) {
                case "approved":
                    statusDisplay = '<span class="status-approved">Approved</span>';
                    break;
                case "rejected":
                    statusDisplay = '<span class="status-rejected">Rejected</span>';
                    break;
                default:
                    statusDisplay = '<span class="status-pending">Pending</span>';
                    actionButtons = `
                        <button class="approve-btn" onclick="approveLateCheckIn(${actualIndex})">Approve</button>
                        <button class="reject-btn" onclick="rejectLateCheckIn(${actualIndex})">Reject</button>
                    `;
            }

            row.innerHTML = `
                <td>${record.employee}</td>
                <td>${record.date}</td>
                <td>${record.day}</td>
                <td>${record.checkInTime}</td>
                <td>${checkOutDisplay}</td>
                <td>${record.reason}</td>
                <td>${workingHoursDisplay}</td>
                <td>${statusDisplay}</td>
                <td class="action-buttons">${actionButtons}</td>
            `;

            tableBody.appendChild(row);
        });
    });
}

// Function for admin to approve late check-in
function approveLateCheckIn(index) {
    console.log("Approving late check-in at index:", index);

    // Get the current selected user before making any changes
    const selectedUser = document.getElementById("adminUserSelect") ?
        document.getElementById("adminUserSelect").value : "";

    lateCheckInRef.once('value', (snapshot) => {
        let lateCheckInRecords = snapshot.val() || [];
        console.log("Total records:", lateCheckInRecords.length);

        if (index >= 0 && index < lateCheckInRecords.length) {
            console.log("Record found at index:", index);
            console.log("Current status:", lateCheckInRecords[index].status);

            // Update the status directly without additional checks
            lateCheckInRecords[index].status = "approved";
            console.log("Status updated to approved");

            // Save to Firebase
            lateCheckInRef.set(lateCheckInRecords)
                .then(() => {
                    console.log("Record successfully updated in Firebase");
                    alert("Late check-in approved successfully.");
                    // Reload the table with the same user filter
                    loadAdminLateCheckInRecords(selectedUser);
                })
                .catch((error) => {
                    console.error("Error approving late check-in:", error);
                    alert("Error approving late check-in. Please try again.");
                });
        } else {
            console.error("Invalid record index:", index);
            alert("Error: Record not found. Please refresh the page and try again.");
            loadAdminLateCheckInRecords(selectedUser);
        }
    });
}

// Function for admin to reject late check-in
function rejectLateCheckIn(index) {
    console.log("Rejecting late check-in at index:", index);

    // Get the current selected user before making any changes
    const selectedUser = document.getElementById("adminUserSelect") ?
        document.getElementById("adminUserSelect").value : "";

    lateCheckInRef.once('value', (snapshot) => {
        let lateCheckInRecords = snapshot.val() || [];
        console.log("Total records:", lateCheckInRecords.length);

        if (index >= 0 && index < lateCheckInRecords.length) {
            console.log("Record found at index:", index);
            console.log("Current status:", lateCheckInRecords[index].status);

            // Update the status directly without additional checks
            lateCheckInRecords[index].status = "rejected";
            console.log("Status updated to rejected");

            // Save to Firebase
            lateCheckInRef.set(lateCheckInRecords)
                .then(() => {
                    console.log("Record successfully updated in Firebase");
                    alert("Late check-in rejected.");
                    // Reload the table with the same user filter
                    loadAdminLateCheckInRecords(selectedUser);
                })
                .catch((error) => {
                    console.error("Error rejecting late check-in:", error);
                    alert("Error rejecting late check-in. Please try again.");
                });
        } else {
            console.error("Invalid record index:", index);
            alert("Error: Record not found. Please refresh the page and try again.");
            loadAdminLateCheckInRecords(selectedUser);
        }
    });
}

// Function to update summary values with late check-in data
function updateLateCheckInSummary() {
    const employee = document.getElementById("employeeDetails").textContent.split("|")[0].trim();

    lateCheckInRef.once('value', (snapshot) => {
        const lateCheckInRecords = snapshot.val() || [];

        // Count approved late check-ins for this employee
        const approvedLateCheckIns = lateCheckInRecords.filter(
            record => record.employee === employee && record.status === "approved"
        ).length;

        // Update the late check-ins counter in the summary section
        const lateCheckInsElement = document.getElementById("lateCheckIns");
        if (lateCheckInsElement) {
            lateCheckInsElement.textContent = approvedLateCheckIns;
        }
    });
}

// Function to check if employee can use late check-in
// This is called when regular check-in is blocked due to time constraints
function canUseLateCheckIn() {
    const now = new Date();
    const employee = document.getElementById("employeeDetails")?.textContent.split("|")[0].trim();
    if (!employee) return false;

    const day = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][now.getDay()];
    const date = standardizeDate(now);

    // Check if employee already has a late check-in for today
    return new Promise((resolve) => {
        lateCheckInRef.once('value', (snapshot) => {
            const lateCheckInRecords = snapshot.val() || [];

            const hasLateCheckInToday = lateCheckInRecords.some(
                record => record.employee === employee && record.date === date
            );

            // Also check if there's a time slot for today
            getFirebaseData("timeTables", (firebaseTimeTables) => {
                const timeTables = firebaseTimeTables || [];
                const employeeSchedule = timeTables.find((t) => t.employee === employee);

                if (!employeeSchedule || !employeeSchedule[day.toLowerCase()]?.slots) {
                    resolve(false);
                    return;
                }

                // If employee has a schedule for today but no late check-in yet, they can use late check-in
                resolve(!hasLateCheckInToday);
            });
        });
    });
}

// Setup event listeners when document is loaded
document.addEventListener("DOMContentLoaded", function () {
    // Add event listener for late check-in buttons
    const lateCheckInBtns = document.querySelectorAll("#lateCheckInBtn, #lateCheckInSectionBtn");
    lateCheckInBtns.forEach(btn => {
        if (btn) {
            btn.addEventListener("click", openLateCheckInModal);
        }
    });

    // Add event listener for late check-out buttons
    const lateCheckOutBtns = document.querySelectorAll("#lateCheckOutBtn, #lateCheckOutSectionBtn");
    lateCheckOutBtns.forEach(btn => {
        if (btn) {
            btn.addEventListener("click", handleLateCheckOut);
        }
    });

    // Add event listener for submit late check-in button
    const submitLateCheckInBtn = document.getElementById("submitLateCheckInBtn");
    if (submitLateCheckInBtn) {
        submitLateCheckInBtn.addEventListener("click", submitLateCheckIn);
    }
});

// Initialize late check-in module
function initLateCheckInModule() {
    // Load late check-in records for employee
    loadLateCheckInTable();

    // Update summary values
    updateLateCheckInSummary();
}
