// Late Check-in and Check-out Module
// This module handles late check-ins and check-outs separately from the regular system

// Initialize Firebase references
const lateCheckInRef = firebase.database().ref("lateCheckInRecords");

// Function to open the late check-in modal
function openLateCheckInModal() {
    const now = new Date();
    const currentTime = now.toLocaleTimeString();

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
    const lateCheckInTime = document.getElementById("lateCheckInTime").value;
    const lateCheckInReason = document.getElementById("lateCheckInReason").value;

    if (!lateCheckInReason) {
        alert("Please provide a reason for your late check-in.");
        return;
    }

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
    const time = now.toLocaleTimeString();

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

    const checkIn = new Date(`1970-01-01T${checkInTime}`);
    const checkOut = new Date(`1970-01-01T${checkOutTime}`);

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
                        <button class="approve-btn" onclick="approveLateCheckIn(${index})">Approve</button>
                        <button class="reject-btn" onclick="rejectLateCheckIn(${index})">Reject</button>
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
    lateCheckInRef.once('value', (snapshot) => {
        let lateCheckInRecords = snapshot.val() || [];

        if (index >= 0 && index < lateCheckInRecords.length) {
            lateCheckInRecords[index].status = "approved";

            lateCheckInRef.set(lateCheckInRecords)
                .then(() => {
                    alert("Late check-in approved successfully.");
                    loadAdminLateCheckInRecords(document.getElementById("adminUserSelect").value);
                })
                .catch((error) => {
                    console.error("Error approving late check-in:", error);
                    alert("Error approving late check-in. Please try again.");
                });
        }
    });
}

// Function for admin to reject late check-in
function rejectLateCheckIn(index) {
    lateCheckInRef.once('value', (snapshot) => {
        let lateCheckInRecords = snapshot.val() || [];

        if (index >= 0 && index < lateCheckInRecords.length) {
            lateCheckInRecords[index].status = "rejected";

            lateCheckInRef.set(lateCheckInRecords)
                .then(() => {
                    alert("Late check-in rejected.");
                    loadAdminLateCheckInRecords(document.getElementById("adminUserSelect").value);
                })
                .catch((error) => {
                    console.error("Error rejecting late check-in:", error);
                    alert("Error rejecting late check-in. Please try again.");
                });
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
