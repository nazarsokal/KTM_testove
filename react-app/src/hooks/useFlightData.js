import { useState, useEffect } from "react";

export const useFlightData = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMockData = async () => {
      try {        
        const response = await fetch(
          "https://43c58431-6fda-42f6-996a-340fd493309f.mock.pstmn.io/api/v1/flight-data/1",
        );
        const responseData = await response.json();
        setData(responseData);
      } catch (error) {
        console.error("Failed to load telemetry:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMockData();
  }, []);

  return { data, loading };
};
