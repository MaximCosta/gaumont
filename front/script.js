(async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const id_cine = urlParams.get("id_cine");
    const id_movie = urlParams.get("id_movie");

    if (!id_cine || !id_movie) return;

    let seats = await fetch(`http://127.0.0.1:5000/${id_cine}/${id_movie}`);
    seats = await seats.json();
    let [y, x] = [seats.rowCount, seats.colCount];
    let seatsType = {
        DIS: {
            0: "seat-pmr-normal",
            1: "seat-pmr-taken",
            5: "seat-pmr-selected",
        },
        STD: {
            0: "seat-normal",
            1: "seat-taken",
            5: "seat-selected",
        },
        DUO: {
            L: {
                0: "seat-duo-normal-1",
                1: "seat-duo-taken-1",
                5: "seat-duo-selected-1",
            },
            R: {
                0: "seat-duo-normal-2",
                1: "seat-duo-taken-2",
                5: "seat-duo-selected-2",
            },
        },
        NON: {
            0: "",
        },
    };

    const getSeatType = (Type, Side, status) => {
        if (Type in seatsType) {
            if (Side in seatsType[Type]) {
                return seatsType[Type][Side][status];
            } else {
                return seatsType[Type][status];
            }
        } else {
            return seatsType["NON"][0];
        }
    };

    let seatsMatrix = [];
    for (let i = 0; i < y; i++) {
        seatsMatrix[i] = [];
        for (let j = 0; j < x; j++) {
            seatsMatrix[i][j] = -1;
        }
    }

    seats.seats.forEach((col) => {
        col.forEach((seat) => {
            seatsMatrix[seat.rowIndex][seat.seatIndex] = seat;
        });
    });

    let seatsTbody = document.getElementById("cine");
    for (let i = 0; i < y; i++) {
        let row = document.createElement("tr");
        for (let j = 0; j < x; j++) {
            let seat = document.createElement("td");
            seat.classList.add("seat");
            seat.setAttribute("data-row", i);
            seat.setAttribute("data-col", j);
            seat.setAttribute("data-status", seatsMatrix[i][j].status);
            seat.setAttribute("data-type", seatsMatrix[i][j].seatType);
            seat.innerHTML = `<svg class="icon" style="width: 32px; height: 32px;" viewBox="0 0 56 56"><use href="seats.svg#{{class}}"></use></svg>`;
            seat.innerHTML = seat.innerHTML.replace("{{class}}", getSeatType(seatsMatrix[i][j].seatType, seatsMatrix[i][j].seatSide, seatsMatrix[i][j].status));
            row.appendChild(seat);
        }
        seatsTbody.appendChild(row);
    }
})();
