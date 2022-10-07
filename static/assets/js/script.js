(async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const id_cine = urlParams.get("id_cine");
    const id_movie = urlParams.get("id_movie");
    if (!id_cine || !id_movie) return;
    let seats = await (await fetch(`/${id_cine}/${id_movie}`)).json();
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

    document.querySelector(".loading").style.display = "none";

    let seatsTbody = document.getElementById("cine");
    for (let i = 0; i < y; i++) {
        let row = document.createElement("tr");
        for (let j = 0; j < x; j++) {
            let seat = document.createElement("td");
            seat.classList.add("seat");
            seat.setAttribute("data-row", i);
            seat.setAttribute("data-col", j);
            seat.setAttribute("data-type", seatsMatrix[i][j].seatType);
            seat.setAttribute("data-side", seatsMatrix[i][j].seatSide);
            seat.setAttribute("data-status", seatsMatrix[i][j].status);
            seat.setAttribute("data-rowName", seatsMatrix[i][j].rowName);
            seat.setAttribute("data-seatName", seatsMatrix[i][j].seatName);
            seat.setAttribute("data-section", seatsMatrix[i][j].section);

            seat.innerHTML = `<svg class="icon" style="width: 32px; height: 32px;" viewBox="0 0 56 56"><use href="/static/assets/svg/seats.svg#${getSeatType(seatsMatrix[i][j].seatType, seatsMatrix[i][j].seatSide, seatsMatrix[i][j].status)}"></use></svg>`;
            row.appendChild(seat);
        }
        seatsTbody.appendChild(row);
    }

    document.querySelector(".loading").remove();

    let elRect = document.querySelector("#cine").getBoundingClientRect();
    window.parent.postMessage(
        {
            type: "resize-iframe",
            payload: {
                width: elRect.width,
                height: elRect.height,
            },
        },
        "*"
    );

    document.addEventListener("click", (e) => {
        // check if target click is a td or a child of td
        if (e.target.nodeName === "TD" || e.target.parentNode.nodeName === "TD" || e.target.parentNode.parentNode.nodeName === "TD") {
            let seat = e.target.nodeName === "TD" ? e.target : e.target.parentNode.nodeName === "TD" ? e.target.parentNode : e.target.parentNode.parentNode;
            let payload = {
                rowIndex: seat.getAttribute("data-row"),
                rowName: seat.getAttribute("data-rowName"),
                seatIndex: seat.getAttribute("data-col"),
                seatName: seat.getAttribute("data-seatName"),
                seatSide: seat.getAttribute("data-side"),
                seatType: seat.getAttribute("data-type"),
                section: seat.getAttribute("data-section"),
                status: seat.getAttribute("data-status"),
            };

            if (payload.status == 0) {
                seat.setAttribute("data-status", 5);
                seat.innerHTML = `<svg class="icon" style="width: 32px; height: 32px;" viewBox="0 0 56 56"><use href="/static/assets/svg/seats.svg#${getSeatType(payload.seatType, payload.seatSide, 5)}"></use></svg>`;

                var myHeaders = new Headers();
                myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

                var urlencoded = new URLSearchParams();
                urlencoded.append("rowIndex", payload.rowIndex);
                urlencoded.append("rowName", payload.rowName);
                urlencoded.append("seatIndex", payload.seatIndex);
                urlencoded.append("seatName", payload.seatName);
                urlencoded.append("seatSide", payload.seatSide);
                urlencoded.append("seatType", payload.seatType);
                urlencoded.append("section", payload.section);

                var requestOptions = {
                    method: "POST",
                    headers: myHeaders,
                    redirect: "follow",
                    body: urlencoded,
                };

                fetch(`/lock/${id_cine}/${id_movie}`, requestOptions);
            }
        }
    });
})();
