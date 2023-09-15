
import { useState, useEffect, createRef } from "react";
import { useSnackbar } from "notistack";
import { useNavigate } from "react-router";
import { AddBox, Edit, Visibility } from "@material-ui/icons";
import MuiTable from "../../components/table/table_index";
import { BASE_URL, PATH_PETSERVICE } from "../../utils/constants";
import makeApiCall from "../../utils/makeApiCall";

function PetServiceTable() {

  const tableRef = createRef();
  const snackbar = useSnackbar();
  const navigate =  useNavigate();


  const columns = [
    { title: "ServiceId", field: "ServiceId", editable: "never" },
      { title: "ServiceAt", field: "ServiceAt" },
      { title: "DogSize", field: "DogSize" },
      { title: "DurationInHours", field: "DurationInHours" },
      { title: "OnlineBookingAllowed", field: "OnlineBookingAllowed" },
      { title: "Price", field: "Price" },
  ];
  
  const fetchData = async (query) => {
    return new Promise(async (resolve, reject) => {
      const { page, orderBy, orderDirection, search, pageSize } = query;
      const url = `${BASE_URL}${PATH_PETSERVICE}`;
      let temp = url; // Initialize with the base URL
      let filterQuery = ""; // Initialize filter query as an empty string
  
      // Handle sorting
      if (orderBy) {
        temp += `?$orderby=${orderBy.field} ${orderDirection}`;
      }
  
      // Handle searching
      if (search) {
        filterQuery = `$filter=contains($screen.getSearchField().getName(), '${search}')`;
        temp += orderBy ? `&${filterQuery}` : `?${filterQuery}`;
      }
  
      // Handle pagination
      if (page > 0) {
        const skip = page * pageSize;
        temp += orderBy || search ? `&$skip=${skip}` : `?$skip=${skip}`;
      }
  
      const countUrl = search ? `${url}/$count?${filterQuery}` : `${BASE_URL}${PATH_PETSERVICE}/$count`;
      let total = null;

      try {
        const countResponse = await makeApiCall(countUrl);
        const e = await countResponse.text();
        total = parseInt(e, 10);
  
        const response = await makeApiCall(temp);
        const { value } = await response.json();
  
        if (value.length === 0) {
          return resolve({
            data: [],
            page: page,
            totalCount: 0,
            error: "Error fetching data"
          });
        } else {
          return resolve({
            data: value,
            page: page,
            totalCount: total,
          });
        }
      } catch (error) {
        snackbar.enqueueSnackbar(`Trips API call Failed! - ${error.message}`, {
          variant: "error",
        });
        console.error("API call failed:", error);
        reject(error);
      }
    });
  };

  return (
    <div className="product-container">
      <MuiTable
        tableRef={tableRef}
        title="PetService Table"
        cols={columns}
        data={fetchData}
        size={5}
        actions={[
          {
            icon: AddBox,
            tooltip: "Add",
            onClick: () => navigate("/PetServices/create"),
            isFreeAction: true,
          },
          {
            icon: Visibility,
            tooltip: "View",
            onClick: (event, rowData) =>
            navigate(`/PetServices/view/${rowData.ServiceId}`),
          },
          {
            icon: Edit,
            tooltip: "Edit",
            onClick: (event, rowData) =>
            navigate(`/PetServices/edit/${rowData.ServiceId}`),
          },
        ]}
        onRowDelete={async (oldData) => {
          const resp = await makeApiCall(
            `${BASE_URL}${PATH_PETSERVICE}(${oldData.ServiceId})`,
            "DELETE"
          );
          if (resp.ok) {
            tableRef.current.onQueryChange();
            snackbar.enqueueSnackbar("Successfully deleted PetServices", {
              variant: "success",
            });
          } else {
            const jsonData = await resp.json();
            snackbar.enqueueSnackbar(`Failed! - ${jsonData.message}`, {
              variant: "error",
            });
          }
        }}
      />
    </div>
  );
}

export default PetServiceTable;
