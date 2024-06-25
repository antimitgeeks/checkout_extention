
import {
  Banner,
  useApi,
  reactExtension,
  Checkbox,
  Grid,
  ScrollView,
  Disclosure,
  Button,
  View,
  BlockSpacer,
  Heading,
  Divider,
  useApplyMetafieldsChange,
  useExtension,
  useCartLines
} from '@shopify/ui-extensions-react/checkout';
import { useState, useEffect } from 'react';

export default reactExtension(
  'purchase.checkout.cart-line-list.render-after',
  () => <Extension />,
);


function Extension() {

  const { query, buyerIdentity } = useApi();

  const { scriptUrl } = useExtension();
  const cartDetails = useCartLines();

  // extract customer , product and url  details 
  const customerId = buyerIdentity?.customer?.current?.id?.split('/')?.pop();
  const productId = cartDetails[0]?.merchandise?.product?.id;
  const SERVER_URL = scriptUrl.split('/').slice(0, 3).join('/').split('.com')[0] + '.com';

  console.log("Customer Id :", customerId);
  console.log("Product Id :", productId);
  console.log("Server Url :", SERVER_URL);


  const [showMore, setShowMore] = useState(true);
  const [selectedNpos, setSelectedNpos] = useState([]);
  const [showWarning, setShowWarning] = useState(false);
  const [showNpo, setShowNpos] = useState(false);
  const [previousData, setPreviousData] = useState([]);
  const [previousLoading, setPreviousLoading] = useState(true)
  const [metaFields, setMetaFields] = useState();

  const updateMetafield = useApplyMetafieldsChange();

  useEffect(() => {
    query(
      `query ($id: ID!) {
        product(id: $id) {
          id
          title
          variants(first: 1) {
            nodes {
              id
              price {
                amount
              }
            }
          }
            metafields(identifiers : [{namespace: "custom", key: "npotesting"}]) {
            value
            type
            description
            id
            key
          }
        }
      }`,
      {
        variables: { id: `${productId}` },
      }
    )
      .then(async ({ data, errors }) => {
        if (errors) {
          console.log('Product MetaFelids fetch Error : ', errors);
        }

        const metaFieldsDetails = data?.product?.metafields;
        if (metaFieldsDetails) {
          let filedArray = metaFieldsDetails
            .filter(metaFieldsDetail => metaFieldsDetail?.value)
            .flatMap(metaFieldsDetail => metaFieldsDetail.value.split(',').map(item => item.trim()));
          filedArray = filedArray?.includes("emptyNpos") ? [] : filedArray
          console.log("Product Fetched MetaFields :", filedArray);
          // check fetched npos valid or not 
          const config = {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ npos: filedArray })
          }
          await fetch(`${SERVER_URL}/npo-valid`, config)
            .then((response) => response.json())
            .then((result) => {
              console.log('Valid NPOS :', result);
              setMetaFields(result.npos);
            })
            .catch((error) => { console.log('Error In Valid NPOS :', error); })
        }
      })
      .catch((error) => console.error('Product MetaFelids fetch Error : ', error))
  }, []);
  console.log("Product MetaField :", metaFields);

  let afterSixData = metaFields?.slice(6, metaFields.length);

  useEffect(() => {
    const fetchData = async () => {
      if (customerId) {
        await fetch(`${SERVER_URL}/customer-order?customerId=${customerId}`)
          .then((response) => response.text())
          .then((result) => {
            setPreviousLoading(false);
            console.log('Previous NPOS :', result);
            setPreviousData(result ? JSON.parse(result) : [])
          })
          .catch((error) => { setPreviousLoading(false); console.log('Error In Previous NPOS :', error); })
      } else {
        setPreviousLoading(false)
      }
    }
    fetchData()
  }, []);


  useEffect(() => {
    const convertedData = previousData?.npos && previousData?.npos[0]?.split(',').map(item => item.trim());
    const filteredData = convertedData?.filter(item => metaFields?.includes(item));
    setSelectedNpos(filteredData || [])
    console.log("Npo Converted Data:", convertedData);
  }, [previousData, metaFields])


  const handleCheckboxChange = (e, val) => {
    if (selectedNpos?.length >= 5) {
      setShowMore(!showMore);
      setShowMore(showMore)
    }
    if (e) {
      if (selectedNpos?.length >= 5) {
        setShowWarning(true);
      }
      else {
        setShowWarning(false)
        setSelectedNpos([...selectedNpos, val]);
      }
    } else {
      setShowWarning(false)
      setSelectedNpos((prev) => {
        return prev?.filter((itm) => {
          return itm !== val;
        });
      });
    }
  };

  console.log("Selected Npos :", selectedNpos);

  const updateMetafieldWithCheckedValues = () => {
    if (showNpo) {
      const checkedValues = selectedNpos.join(', ');
      updateMetafield({
        type: "updateMetafield",
        namespace: 'custom',
        key: 'ngo_data',
        valueType: "string",
        value: checkedValues,
      });
    }
  };


  useEffect(() => {
    updateMetafieldWithCheckedValues();
  }, [selectedNpos]);


  return (
    <>
      <Checkbox toggles='donation' onChange={() => setShowNpos(!showNpo)}>
        Do Donation To NGOS
      </Checkbox>
      {
        showNpo &&
        <BlockSpacer />
      }
      {
        previousLoading ? ""
          :
          showNpo &&
          <View id='donation'>
            <Heading level={2}>NGO List</Heading>
            {showNpo &&
              <BlockSpacer />
            }
            {
              showWarning &&
              <>
                <Banner status='warning'>You can Only select Upto 5 Ngos</Banner>
                <BlockSpacer />
              </>
            }
            <Disclosure>
              <>
                <Grid
                  columns={['.38fr', '.34fr', '.3fr']}
                  rows={['fill', 'fill']}
                  spacing="tight"
                >
                  {metaFields?.slice(0, 6)?.map((itm, idx) => {
                    return <Checkbox checked={selectedNpos?.includes(itm)} onChange={(e) => handleCheckboxChange(e, itm)} key={idx} id={itm} name={itm}>
                      {itm}
                    </Checkbox>
                  })}
                </Grid>
                <BlockSpacer spacing={'tight'} />
                {
                  showMore ?
                    <>
                      {metaFields?.length > 6 &&
                        <Button kind='plain' toggles='npo' onPress={() => { setShowMore(!showMore) }}>
                          {showMore ? "Show More " : "Show Less "}
                        </Button>
                      }
                      {/* {myArr2?.length > 6 && <BlockSpacer />} */}
                      <ScrollView maxBlockSize={150}>
                        <View id='npo'>
                          <Grid
                            columns={['.42fr', '.35fr', '.3fr']}
                            rows={['fill', 'fill']}
                            spacing="tight"
                          >
                            {afterSixData?.map((itm, idx) => {
                              return <Checkbox checked={selectedNpos?.includes(itm)} onChange={(e) => handleCheckboxChange(e, itm)} >
                                {itm}
                              </Checkbox>
                            })}
                          </Grid>
                        </View>
                      </ScrollView>
                    </>
                    : <>
                      <ScrollView maxBlockSize={150}>
                        <View id='npo'>
                          <Grid
                            columns={['.43fr', '.38fr', '.3fr']}
                            rows={['fill', 'fill']}
                            spacing="tight"
                          >
                            {metaFields?.slice(6, metaFields.length)?.map((itm, idx) => {
                              return <Checkbox checked={selectedNpos?.includes(itm)} onChange={(e) => handleCheckboxChange(e, itm)} key={idx} id={itm} name={itm}>
                                {itm}
                              </Checkbox>
                            })}
                          </Grid>
                        </View>
                      </ScrollView>
                      {metaFields?.length > 6 &&
                        <>
                          <BlockSpacer />
                          <Button kind='plain' toggles='npo' onPress={() => { setShowMore(!showMore) }}>
                            {showMore ? "Show More " : "Show Less "}
                          </Button>
                          <BlockSpacer />
                        </>
                      }
                    </>
                }

              </>
            </Disclosure>
            <Divider />
          </View>
      }
    </>
  );
}